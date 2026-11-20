
package com.pos.backend.cathu;

import java.security.Principal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/quan-ly-ca")
public class QuanLyCaController {

    private final JdbcTemplate jdbc;

    private static final List<CaMacDinh> CAC_CA = List.of(
            new CaMacDinh("SANG", "06:00", "14:00"),
            new CaMacDinh("CHIEU", "14:00", "18:00"),
            new CaMacDinh("TOI", "18:00", "22:00")
    );

    private static final String SQL_LICH = """
            SELECT DATE_FORMAT(?, '%Y-%m-%d') AS ngay_lam_viec,
                   lich.loai_ca,
                   COALESCE(
                       DATE_FORMAT(ca.gio_bat_dau, '%H:%i'),
                       lich.gio_bat_dau
                   ) AS gio_bat_dau,
                   COALESCE(
                       DATE_FORMAT(ca.gio_ket_thuc, '%H:%i'),
                       lich.gio_ket_thuc
                   ) AS gio_ket_thuc,
                   COALESCE(ca.trang_thai, 'CHUA_TAO') AS trang_thai,
                   ca.id AS id_ca,
                   pc.id AS id_phan_cong,
                   tk.id AS id_tai_khoan,
                   tk.ho_ten AS ten_thu_ngan,
                   tk.ten_dang_nhap,
                   EXISTS (
                       SELECT 1
                       FROM phien_thu_ngan p
                       WHERE p.id_phan_cong_ca = pc.id
                   ) AS co_phien
            FROM (
                SELECT 'SANG' AS loai_ca,
                       '06:00' AS gio_bat_dau,
                       '14:00' AS gio_ket_thuc,
                       1 AS thu_tu
                UNION ALL
                SELECT 'CHIEU', '14:00', '18:00', 2
                UNION ALL
                SELECT 'TOI', '18:00', '22:00', 3
            ) lich
            LEFT JOIN ca_lam_viec ca
                ON ca.id_chi_nhanh = ?
                AND ca.ngay_lam_viec = ?
                AND ca.loai_ca = lich.loai_ca
            LEFT JOIN phan_cong_ca pc
                ON pc.id_ca_lam_viec = ca.id
                AND pc.nhiem_vu = 'THU_NGAN'
            LEFT JOIN tai_khoan tk ON tk.id = pc.id_tai_khoan
            ORDER BY lich.thu_tu
            """;

    public QuanLyCaController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private record CaMacDinh(
            String loaiCa,
            String gioBatDau,
            String gioKetThuc
    ) {}

    private record CaCoBan(
            long id,
            String trangThai
    ) {}

    private record PhanCongHienTai(
            long id,
            long idTaiKhoan
    ) {}

    private record TaiKhoanQuanLy(
            long id,
            Long idChiNhanh,
            String maVaiTro,
            String trangThaiChiNhanh
    ) {}

    public record NhanVienResponse(
            long id,
            String hoTen,
            String tenDangNhap
    ) {}

    public record CaLamViecResponse(
            String ngayLamViec,
            String loaiCa,
            String gioBatDau,
            String gioKetThuc,
            String trangThai,
            Long idCaLamViec,
            Long idPhanCongCa,
            Long idTaiKhoanThuNgan,
            String tenThuNgan,
            String tenDangNhapThuNgan,
            boolean coPhien
    ) {}

    public record PhanCongRequest(
            String ngayLamViec,
            String loaiCa,
            Long idTaiKhoanThuNgan
    ) {}

    @GetMapping("/nhan-vien")
    public List<NhanVienResponse> layDanhSachNhanVien(
            Principal principal
    ) {
        TaiKhoanQuanLy tk = layQuanLy(principal.getName());

        return jdbc.query("""
                SELECT tk.id,
                       tk.ho_ten,
                       tk.ten_dang_nhap
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                WHERE tk.id_chi_nhanh = ?
                  AND vt.ma_vai_tro = 'CASHIER'
                  AND vt.trang_thai = 'DANG_DUNG'
                  AND tk.trang_thai = 'HOAT_DONG'
                ORDER BY tk.ho_ten, tk.id
                """, (rs, i) -> new NhanVienResponse(
                rs.getLong("id"),
                rs.getString("ho_ten"),
                rs.getString("ten_dang_nhap")
        ), tk.idChiNhanh());
    }

    @GetMapping
    public List<CaLamViecResponse> layDanhSachCa(
            @RequestParam(required = false) String ngay,
            Principal principal
    ) {
        TaiKhoanQuanLy tk = layQuanLy(principal.getName());

        LocalDate ngayTim = ngay == null || ngay.isBlank()
                ? ngayHienTai()
                : docNgay(ngay);

        Date ngaySql = Date.valueOf(ngayTim);

        return jdbc.query(
                SQL_LICH,
                (rs, i) -> new CaLamViecResponse(
                        rs.getString("ngay_lam_viec"),
                        rs.getString("loai_ca"),
                        rs.getString("gio_bat_dau"),
                        rs.getString("gio_ket_thuc"),
                        rs.getString("trang_thai"),
                        rs.getObject("id_ca", Long.class),
                        rs.getObject("id_phan_cong", Long.class),
                        rs.getObject("id_tai_khoan", Long.class),
                        rs.getString("ten_thu_ngan"),
                        rs.getString("ten_dang_nhap"),
                        rs.getBoolean("co_phien")
                ),
                ngaySql,
                tk.idChiNhanh(),
                ngaySql
        );
    }

    @PostMapping("/phan-cong")
    @Transactional
    public CaLamViecResponse phanCongNhanVien(
            @RequestBody PhanCongRequest request,
            Principal principal
    ) {
        if (request == null
                || request.idTaiKhoanThuNgan() == null
                || request.idTaiKhoanThuNgan() <= 0) {
            throw loiNhap("Vui lòng chọn nhân viên thu ngân.");
        }

        TaiKhoanQuanLy tk = layQuanLy(principal.getName());

        LocalDate ngay = docNgay(request.ngayLamViec());

        if (ngay.isBefore(ngayHienTai())) {
            throw loiNhap("Không thể phân công vào ngày đã qua.");
        }

        String loaiCa = request.loaiCa() == null
                ? ""
                : request.loaiCa().strip().toUpperCase(Locale.ROOT);

        CaMacDinh mauCa = CAC_CA.stream()
                .filter(c -> c.loaiCa().equals(loaiCa))
                .findFirst()
                .orElseThrow(() -> loiNhap("Loại ca không hợp lệ."));

        List<Long> chiNhanh = jdbc.query("""
                SELECT id
                FROM chi_nhanh
                WHERE id = ?
                  AND trang_thai = 'HOAT_DONG'
                FOR UPDATE
                """, (rs, i) -> rs.getLong("id"), tk.idChiNhanh());

        if (chiNhanh.isEmpty()) {
            throw loiCam("Chi nhánh không còn hoạt động.");
        }

        List<Long> nhanVien = jdbc.query("""
                SELECT tk.id
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                WHERE tk.id = ?
                  AND tk.id_chi_nhanh = ?
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND vt.ma_vai_tro = 'CASHIER'
                  AND vt.trang_thai = 'DANG_DUNG'
                FOR UPDATE
                """, (rs, i) -> rs.getLong("id"),
                request.idTaiKhoanThuNgan(),
                tk.idChiNhanh());

        if (nhanVien.isEmpty()) {
            throw loiNhap(
                    "Thu ngân không hoạt động hoặc không thuộc chi nhánh này."
            );
        }

        List<CaCoBan> dsCa = jdbc.query("""
                SELECT id, trang_thai
                FROM ca_lam_viec
                WHERE id_chi_nhanh = ?
                  AND ngay_lam_viec = ?
                  AND loai_ca = ?
                FOR UPDATE
                """, (rs, i) -> new CaCoBan(
                rs.getLong("id"),
                rs.getString("trang_thai")
        ), tk.idChiNhanh(), Date.valueOf(ngay), loaiCa);

        Long idCa;

        if (dsCa.isEmpty()) {
            Timestamp batDau = Timestamp.valueOf(
                    ngay.atTime(LocalTime.parse(mauCa.gioBatDau()))
            );

            Timestamp ketThuc = Timestamp.valueOf(
                    ngay.atTime(LocalTime.parse(mauCa.gioKetThuc()))
            );

            jdbc.update("""
                    INSERT INTO ca_lam_viec
                        (id_chi_nhanh, ngay_lam_viec, loai_ca,
                         gio_bat_dau, gio_ket_thuc, trang_thai)
                    VALUES (?, ?, ?, ?, ?, 'DU_KIEN')
                    """,
                    tk.idChiNhanh(),
                    Date.valueOf(ngay),
                    loaiCa,
                    batDau,
                    ketThuc
            );

            idCa = jdbc.queryForObject(
                    "SELECT LAST_INSERT_ID()",
                    Long.class
            );
        } else {
            CaCoBan ca = dsCa.get(0);

            idCa = ca.id();

            if ("KET_THUC".equals(ca.trangThai())) {
                throw loiTrung("Ca này đã kết thúc.");
            }
        }

        if (idCa == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không tạo được ca làm việc."
            );
        }

        List<PhanCongHienTai> dsPhanCong = jdbc.query("""
                SELECT id, id_tai_khoan
                FROM phan_cong_ca
                WHERE id_ca_lam_viec = ?
                  AND nhiem_vu = 'THU_NGAN'
                FOR UPDATE
                """, (rs, i) -> new PhanCongHienTai(
                rs.getLong("id"),
                rs.getLong("id_tai_khoan")
        ), idCa);

        if (dsPhanCong.size() > 1) {
            throw loiTrung(
                    "Ca này có nhiều phân công thu ngân. Vui lòng kiểm tra dữ liệu."
            );
        }

        Long idPhanCong = null;
        boolean cungNhanVien = false;

        if (!dsPhanCong.isEmpty()) {
            PhanCongHienTai pc = dsPhanCong.get(0);

            idPhanCong = pc.id();
            cungNhanVien = pc.idTaiKhoan()
                    == request.idTaiKhoanThuNgan();

            Integer soPhien = jdbc.queryForObject("""
                    SELECT COUNT(*)
                    FROM phien_thu_ngan
                    WHERE id_phan_cong_ca = ?
                    """, Integer.class, idPhanCong);

            if (soPhien != null && soPhien > 0 && !cungNhanVien) {
                throw loiTrung(
                        "Ca này đã có nhân viên mở phiên thu ngân. Không thể thay đổi phân công."
                );
            }
        }

        Timestamp batDau = Timestamp.valueOf(
                ngay.atTime(LocalTime.parse(mauCa.gioBatDau()))
        );

        Timestamp ketThuc = Timestamp.valueOf(
                ngay.atTime(LocalTime.parse(mauCa.gioKetThuc()))
        );

        Integer trungLich = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM phan_cong_ca pc
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                WHERE pc.id_tai_khoan = ?
                  AND pc.nhiem_vu = 'THU_NGAN'
                  AND ca.id_chi_nhanh = ?
                  AND ca.ngay_lam_viec = ?
                  AND ca.id <> ?
                  AND ca.gio_bat_dau < ?
                  AND ca.gio_ket_thuc > ?
                  AND ca.trang_thai IN ('DU_KIEN', 'DANG_DIEN_RA')
                """, Integer.class,
                request.idTaiKhoanThuNgan(),
                tk.idChiNhanh(),
                Date.valueOf(ngay),
                idCa,
                ketThuc,
                batDau
        );

        if (trungLich != null && trungLich > 0) {
            throw loiTrung(
                    "Thu ngân đã được phân công vào một ca bị trùng giờ."
            );
        }

        if (dsPhanCong.isEmpty()) {
            jdbc.update("""
                    INSERT INTO phan_cong_ca
                        (id_ca_lam_viec, id_tai_khoan, nhiem_vu)
                    VALUES (?, ?, 'THU_NGAN')
                    """, idCa, request.idTaiKhoanThuNgan());

        } else if (!cungNhanVien) {
            jdbc.update("""
                    UPDATE phan_cong_ca
                    SET id_tai_khoan = ?
                    WHERE id = ?
                    """, request.idTaiKhoanThuNgan(), idPhanCong);
        }

        return layDanhSachCa(ngay.toString(), principal)
                .stream()
                .filter(c -> c.loaiCa().equals(loaiCa))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy ca vừa phân công."
                ));
    }

    private TaiKhoanQuanLy layQuanLy(String tenDangNhap) {
        List<TaiKhoanQuanLy> ketQua = jdbc.query("""
                SELECT tk.id,
                       tk.id_chi_nhanh,
                       vt.ma_vai_tro,
                       cn.trang_thai AS trang_thai_chi_nhanh
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                LEFT JOIN chi_nhanh cn ON cn.id = tk.id_chi_nhanh
                WHERE tk.ten_dang_nhap = ?
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND vt.trang_thai = 'DANG_DUNG'
                """, (rs, i) -> new TaiKhoanQuanLy(
                rs.getLong("id"),
                rs.getObject("id_chi_nhanh", Long.class),
                rs.getString("ma_vai_tro"),
                rs.getString("trang_thai_chi_nhanh")
        ), tenDangNhap);

        if (ketQua.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tài khoản không hợp lệ."
            );
        }

        TaiKhoanQuanLy tk = ketQua.get(0);

        if (!"MANAGER".equals(tk.maVaiTro())) {
            throw loiCam("Chức năng này chỉ dành cho cửa hàng trưởng.");
        }

        if (tk.idChiNhanh() == null
                || !"HOAT_DONG".equals(tk.trangThaiChiNhanh())) {
            throw loiCam("Tài khoản chưa được gán chi nhánh hoạt động.");
        }

        return tk;
    }

    private LocalDate ngayHienTai() {
        return jdbc.queryForObject(
                "SELECT CURDATE()",
                (rs, i) -> rs.getDate(1).toLocalDate()
        );
    }

    private LocalDate docNgay(String value) {
        if (value == null || value.isBlank()) {
            throw loiNhap("Ngày làm việc không hợp lệ.");
        }

        try {
            return LocalDate.parse(value.strip());
        } catch (DateTimeParseException ex) {
            throw loiNhap("Ngày phải có định dạng YYYY-MM-DD.");
        }
    }

    private ResponseStatusException loiNhap(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST, message
        );
    }

    private ResponseStatusException loiCam(String message) {
        return new ResponseStatusException(
                HttpStatus.FORBIDDEN, message
        );
    }

    private ResponseStatusException loiTrung(String message) {
        return new ResponseStatusException(
                HttpStatus.CONFLICT, message
        );
    }
}
