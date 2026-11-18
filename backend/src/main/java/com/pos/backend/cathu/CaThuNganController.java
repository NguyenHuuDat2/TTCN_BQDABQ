
package com.pos.backend.cathu;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/thu-ngan")
public class CaThuNganController {

    private static final BigDecimal GIOI_HAN_TIEN =
            new BigDecimal("9999999999999999.99");

    private final JdbcTemplate jdbc;

    public CaThuNganController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record MoPhienRequest(
            Long idPhanCongCa,
            BigDecimal tienDauCa
    ) {}

    public record DongPhienRequest(
            BigDecimal tienThucTe
    ) {}

    public record PhanCongCaResponse(
            long idPhanCongCa,
            long idCaLamViec,
            String ngayLamViec,
            String loaiCa,
            String gioBatDau,
            String gioKetThuc,
            String tenChiNhanh
    ) {}

    public record PhienResponse(
            long id,
            String ngayLamViec,
            String loaiCa,
            String tenChiNhanh,
            String tenThuNgan,
            String thoiGianMo,
            String thoiGianDong,
            BigDecimal tienDauCa,
            BigDecimal doanhThuTienMat,
            BigDecimal doanhThuQr,
            BigDecimal tienDuKienCuoiCa,
            BigDecimal tienThucTe,
            BigDecimal tienChenhLech,
            int soHoaDon,
            String trangThai
    ) {}

    public record GiaoDichResponse(
            String soHoaDon,
            String thoiGian,
            String phuongThuc,
            BigDecimal soTien,
            String trangThai
    ) {}

    public record DoiSoatChiTiet(
            PhienResponse phien,
            List<GiaoDichResponse> giaoDich
    ) {}

    private record TaiKhoan(
            long id,
            Long idChiNhanh,
            String maVaiTro
    ) {}

    private record PhanCong(
            long id,
            long idCaLamViec,
            long idChiNhanh
    ) {}

    private record PhienCoBan(
            long id,
            String ngayLamViec,
            String loaiCa,
            String tenChiNhanh,
            String tenThuNgan,
            String thoiGianMo,
            String thoiGianDong,
            BigDecimal tienDauCa,
            BigDecimal tienDuKienCuoiCa,
            BigDecimal tienThucTe,
            BigDecimal tienChenhLech,
            String trangThai
    ) {}

    private record ThongKe(
            BigDecimal doanhThuTienMat,
            BigDecimal doanhThuQr,
            int soHoaDon
    ) {}

    @GetMapping("/phan-cong-cua-toi")
    public List<PhanCongCaResponse> layPhanCongCuaToi(
            Principal principal
    ) {
        TaiKhoan tk = layTaiKhoan(principal.getName());
        kiemTraThuNgan(tk);

        return jdbc.query("""
                SELECT pc.id AS id_phan_cong,
                       ca.id AS id_ca,
                       DATE_FORMAT(ca.ngay_lam_viec, '%d/%m/%Y') AS ngay_lam_viec,
                       ca.loai_ca,
                       DATE_FORMAT(ca.gio_bat_dau, '%H:%i') AS gio_bat_dau,
                       DATE_FORMAT(ca.gio_ket_thuc, '%H:%i') AS gio_ket_thuc,
                       cn.ten_chi_nhanh
                FROM phan_cong_ca pc
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                JOIN chi_nhanh cn ON cn.id = ca.id_chi_nhanh
                WHERE pc.id_tai_khoan = ?
                  AND pc.nhiem_vu = 'THU_NGAN'
                  AND ca.ngay_lam_viec = CURDATE()
                  AND ca.trang_thai IN ('DU_KIEN', 'DANG_DIEN_RA')
                  AND NOT EXISTS (
                      SELECT 1
                      FROM phien_thu_ngan p
                      WHERE p.id_phan_cong_ca = pc.id
                  )
                ORDER BY ca.gio_bat_dau
                """, (rs, i) -> new PhanCongCaResponse(
                rs.getLong("id_phan_cong"),
                rs.getLong("id_ca"),
                rs.getString("ngay_lam_viec"),
                rs.getString("loai_ca"),
                rs.getString("gio_bat_dau"),
                rs.getString("gio_ket_thuc"),
                rs.getString("ten_chi_nhanh")
        ), tk.id());
    }

    @GetMapping("/phien/hien-tai")
    public ResponseEntity<PhienResponse> layPhienHienTai(Principal principal) {
        TaiKhoan tk = layTaiKhoan(principal.getName());
        kiemTraThuNgan(tk);

        Long idPhien = timPhienDangMo(tk.id(), false);

        if (idPhien == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(docPhien(idPhien));
    }

    @PostMapping("/phien/mo")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PhienResponse moPhien(
            @RequestBody MoPhienRequest request,
            Principal principal
    ) {
        if (request == null
                || request.idPhanCongCa() == null
                || request.idPhanCongCa() <= 0
                || !tienHopLe(request.tienDauCa())) {
            throw loiNhap("Số tiền đầu ca hoặc thông tin phân công không hợp lệ.");
        }

        TaiKhoan tk = layTaiKhoanKhoa(principal.getName());
        kiemTraThuNgan(tk);

        if (tk.idChiNhanh() == null) {
            throw loiCam("Tài khoản chưa được gán chi nhánh.");
        }

        Long phienDangMo = timPhienDangMo(tk.id(), true);

        if (phienDangMo != null) {
            throw loiTrung("Bạn đang có một phiên thu ngân chưa đóng.");
        }

        List<PhanCong> dsPhanCong = jdbc.query("""
                SELECT pc.id,
                       ca.id AS id_ca,
                       ca.id_chi_nhanh
                FROM phan_cong_ca pc
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                WHERE pc.id = ?
                  AND pc.id_tai_khoan = ?
                  AND pc.nhiem_vu = 'THU_NGAN'
                  AND ca.id_chi_nhanh = ?
                  AND ca.ngay_lam_viec = CURDATE()
                  AND ca.trang_thai IN ('DU_KIEN', 'DANG_DIEN_RA')
                FOR UPDATE
                """, (rs, i) -> new PhanCong(
                rs.getLong("id"),
                rs.getLong("id_ca"),
                rs.getLong("id_chi_nhanh")
        ), request.idPhanCongCa(), tk.id(), tk.idChiNhanh());

        if (dsPhanCong.isEmpty()) {
            throw loiCam("Bạn không được phân công vào ca này hoặc ca không còn hợp lệ.");
        }

        PhanCong pc = dsPhanCong.get(0);

        Integer daMoTruocDo = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM phien_thu_ngan
                WHERE id_phan_cong_ca = ?
                """, Integer.class, pc.id());

        if (daMoTruocDo != null && daMoTruocDo > 0) {
            throw loiTrung("Ca này đã từng được mở phiên thu ngân.");
        }

        jdbc.update("""
                INSERT INTO phien_thu_ngan
                    (id_phan_cong_ca, thoi_gian_mo, tien_dau_ca, trang_thai)
                VALUES (?, NOW(), ?, 'DANG_MO')
                """, pc.id(), request.tienDauCa());

        Long idPhien = jdbc.queryForObject(
                "SELECT LAST_INSERT_ID()", Long.class
        );

        jdbc.update("""
                UPDATE ca_lam_viec
                SET trang_thai = 'DANG_DIEN_RA'
                WHERE id = ? AND trang_thai = 'DU_KIEN'
                """, pc.idCaLamViec());

        return docPhien(idPhien);
    }

    @PostMapping("/phien/dong")
    @Transactional
    public PhienResponse dongPhien(
            @RequestBody DongPhienRequest request,
            Principal principal
    ) {
        if (request == null || !tienHopLe(request.tienThucTe())) {
            throw loiNhap("Số tiền thực tế không hợp lệ.");
        }

        TaiKhoan tk = layTaiKhoanKhoa(principal.getName());
        kiemTraThuNgan(tk);

        Long idPhien = timPhienDangMo(tk.id(), true);

        if (idPhien == null) {
            throw loiTrung("Bạn hiện không có phiên thu ngân đang mở.");
        }

        Integer giaoDichCho = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM hoa_don
                WHERE id_phien_thu_ngan = ?
                  AND trang_thai <> 'DA_THANH_TOAN'
                """, Integer.class, idPhien);

        if (giaoDichCho != null && giaoDichCho > 0) {
            throw loiTrung("Vẫn còn hóa đơn chưa thanh toán. Vui lòng xử lý trước khi đóng phiên.");
        }

        PhienResponse phien = docPhien(idPhien);

        BigDecimal tienDuKien = phien.tienDauCa()
                .add(phien.doanhThuTienMat());

        BigDecimal tienThucTe = request.tienThucTe();
        BigDecimal chenhLech = tienThucTe.subtract(tienDuKien);

        int soDong = jdbc.update("""
                UPDATE phien_thu_ngan
                SET thoi_gian_dong = NOW(),
                    tien_du_kien_cuoi_ca = ?,
                    tien_thuc_te = ?,
                    tien_chenh_lech = ?,
                    trang_thai = 'CHO_DOI_SOAT'
                WHERE id = ?
                  AND thoi_gian_dong IS NULL
                  AND trang_thai = 'DANG_MO'
                """, tienDuKien, tienThucTe, chenhLech, idPhien);

        if (soDong != 1) {
            throw loiTrung("Phiên thu ngân đã được đóng hoặc không còn hợp lệ.");
        }

        return docPhien(idPhien);
    }

    @GetMapping("/doi-soat")
    public List<PhienResponse> layDanhSachDoiSoat(
            Principal principal
    ) {
        TaiKhoan tk = layTaiKhoan(principal.getName());
        kiemTraQuanLy(tk);

        String sql = """
                SELECT p.id
                FROM phien_thu_ngan p
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                WHERE p.trang_thai = 'CHO_DOI_SOAT'
                """;

        List<Long> ids;

        if ("ADMIN".equals(tk.maVaiTro())) {
            ids = jdbc.query(
                    sql + " ORDER BY p.thoi_gian_dong DESC",
                    (rs, i) -> rs.getLong("id")
            );
        } else {
            ids = jdbc.query(
                    sql + """
                             AND ca.id_chi_nhanh = ?
                             ORDER BY p.thoi_gian_dong DESC
                            """,
                    (rs, i) -> rs.getLong("id"),
                    tk.idChiNhanh()
            );
        }

        return ids.stream().map(this::docPhien).toList();
    }

    @GetMapping("/doi-soat/{id}")
    public DoiSoatChiTiet xemChiTietDoiSoat(
            @PathVariable long id,
            Principal principal
    ) {
        TaiKhoan tk = layTaiKhoan(principal.getName());
        kiemTraQuanLy(tk);
        kiemTraChiNhanhPhien(id, tk);

        PhienResponse phien = docPhien(id);

        List<GiaoDichResponse> giaoDich = jdbc.query("""
                SELECT h.so_hoa_don,
                       DATE_FORMAT(h.thoi_gian_hoan_tat, '%d/%m/%Y %H:%i:%s') AS thoi_gian,
                       t.phuong_thuc,
                       t.so_tien_thanh_toan,
                       t.trang_thai
                FROM hoa_don h
                LEFT JOIN thanh_toan t ON t.id_hoa_don = h.id
                WHERE h.id_phien_thu_ngan = ?
                ORDER BY h.id
                """, (rs, i) -> new GiaoDichResponse(
                rs.getString("so_hoa_don"),
                rs.getString("thoi_gian"),
                rs.getString("phuong_thuc"),
                rs.getBigDecimal("so_tien_thanh_toan"),
                rs.getString("trang_thai")
        ), id);

        return new DoiSoatChiTiet(phien, giaoDich);
    }

    @PostMapping("/doi-soat/{id}")
    @Transactional
    public PhienResponse xacNhanDoiSoat(
            @PathVariable long id,
            Principal principal
    ) {
        TaiKhoan tk = layTaiKhoanKhoa(principal.getName());
        kiemTraQuanLy(tk);

        List<Long> phien = jdbc.query("""
                SELECT p.id
                FROM phien_thu_ngan p
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                WHERE p.id = ?
                  AND p.trang_thai = 'CHO_DOI_SOAT'
                FOR UPDATE
                """, (rs, i) -> rs.getLong("id"), id);

        if (phien.isEmpty()) {
            throw loiTrung("Phiên không tồn tại hoặc đã được đối soát.");
        }

        kiemTraChiNhanhPhien(id, tk);

        int soDong = jdbc.update("""
                UPDATE phien_thu_ngan
                SET trang_thai = 'DA_DOI_SOAT',
                    id_nguoi_doi_soat = ?,
                    thoi_gian_doi_soat = NOW()
                WHERE id = ?
                  AND trang_thai = 'CHO_DOI_SOAT'
                """, tk.id(), id);

        if (soDong != 1) {
            throw loiTrung("Không thể xác nhận đối soát phiên này.");
        }

        return docPhien(id);
    }

    private PhienResponse docPhien(long id) {
        PhienCoBan p = jdbc.query("""
                SELECT p.id,
                       DATE_FORMAT(ca.ngay_lam_viec, '%d/%m/%Y') AS ngay_lam_viec,
                       ca.loai_ca,
                       cn.ten_chi_nhanh,
                       tk.ho_ten AS ten_thu_ngan,
                       DATE_FORMAT(p.thoi_gian_mo, '%d/%m/%Y %H:%i:%s') AS thoi_gian_mo,
                       DATE_FORMAT(p.thoi_gian_dong, '%d/%m/%Y %H:%i:%s') AS thoi_gian_dong,
                       p.tien_dau_ca,
                       p.tien_du_kien_cuoi_ca,
                       p.tien_thuc_te,
                       p.tien_chenh_lech,
                       p.trang_thai
                FROM phien_thu_ngan p
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                JOIN chi_nhanh cn ON cn.id = ca.id_chi_nhanh
                JOIN tai_khoan tk ON tk.id = pc.id_tai_khoan
                WHERE p.id = ?
                """, (rs, i) -> new PhienCoBan(
                rs.getLong("id"),
                rs.getString("ngay_lam_viec"),
                rs.getString("loai_ca"),
                rs.getString("ten_chi_nhanh"),
                rs.getString("ten_thu_ngan"),
                rs.getString("thoi_gian_mo"),
                rs.getString("thoi_gian_dong"),
                rs.getBigDecimal("tien_dau_ca"),
                rs.getBigDecimal("tien_du_kien_cuoi_ca"),
                rs.getBigDecimal("tien_thuc_te"),
                rs.getBigDecimal("tien_chenh_lech"),
                rs.getString("trang_thai")
        ), id).stream().findFirst().orElseThrow(
                () -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy phiên thu ngân."
                )
        );

        ThongKe tk = jdbc.queryForObject("""
                SELECT
                    COALESCE(SUM(
                        CASE WHEN t.phuong_thuc = 'TIEN_MAT'
                        THEN t.so_tien_thanh_toan ELSE 0 END
                    ), 0) AS doanh_thu_tien_mat,
                    COALESCE(SUM(
                        CASE WHEN t.phuong_thuc = 'QR'
                        THEN t.so_tien_thanh_toan ELSE 0 END
                    ), 0) AS doanh_thu_qr,
                    COUNT(DISTINCT h.id) AS so_hoa_don
                FROM hoa_don h
                JOIN thanh_toan t ON t.id_hoa_don = h.id
                WHERE h.id_phien_thu_ngan = ?
                  AND h.trang_thai = 'DA_THANH_TOAN'
                  AND t.trang_thai = 'DA_XAC_NHAN'
                """, (rs, i) -> new ThongKe(
                rs.getBigDecimal("doanh_thu_tien_mat"),
                rs.getBigDecimal("doanh_thu_qr"),
                rs.getInt("so_hoa_don")
        ), id);

        BigDecimal tienDuKien = p.tienDuKienCuoiCa() != null
                ? p.tienDuKienCuoiCa()
                : p.tienDauCa().add(tk.doanhThuTienMat());

        return new PhienResponse(
                p.id(),
                p.ngayLamViec(),
                p.loaiCa(),
                p.tenChiNhanh(),
                p.tenThuNgan(),
                p.thoiGianMo(),
                p.thoiGianDong(),
                p.tienDauCa(),
                tk.doanhThuTienMat(),
                tk.doanhThuQr(),
                tienDuKien,
                p.tienThucTe(),
                p.tienChenhLech(),
                tk.soHoaDon(),
                p.trangThai()
        );
    }

    private TaiKhoan layTaiKhoan(String tenDangNhap) {
        return jdbc.query("""
                SELECT tk.id, tk.id_chi_nhanh, vt.ma_vai_tro
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                WHERE tk.ten_dang_nhap = ?
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND vt.trang_thai = 'DANG_DUNG'
                """, (rs, i) -> new TaiKhoan(
                rs.getLong("id"),
                rs.getObject("id_chi_nhanh", Long.class),
                rs.getString("ma_vai_tro")
        ), tenDangNhap).stream().findFirst().orElseThrow(
                () -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Tài khoản không hợp lệ."
                )
        );
    }

    private TaiKhoan layTaiKhoanKhoa(String tenDangNhap) {
        return jdbc.query("""
                SELECT tk.id, tk.id_chi_nhanh, vt.ma_vai_tro
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                WHERE tk.ten_dang_nhap = ?
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND vt.trang_thai = 'DANG_DUNG'
                FOR UPDATE
                """, (rs, i) -> new TaiKhoan(
                rs.getLong("id"),
                rs.getObject("id_chi_nhanh", Long.class),
                rs.getString("ma_vai_tro")
        ), tenDangNhap).stream().findFirst().orElseThrow(
                () -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Tài khoản không hợp lệ."
                )
        );
    }

    private Long timPhienDangMo(long idTaiKhoan, boolean khoa) {
        String sql = """
                SELECT p.id
                FROM phien_thu_ngan p
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                WHERE pc.id_tai_khoan = ?
                  AND p.thoi_gian_dong IS NULL
                  AND p.trang_thai = 'DANG_MO'
                """ + (khoa ? " FOR UPDATE" : "");

        List<Long> ids = jdbc.query(
                sql, (rs, i) -> rs.getLong("id"), idTaiKhoan
        );

        if (ids.size() > 1) {
            throw loiTrung("Tài khoản đang có nhiều phiên thu ngân chưa đóng.");
        }

        return ids.isEmpty() ? null : ids.get(0);
    }

    private void kiemTraThuNgan(TaiKhoan tk) {
        if (!"CASHIER".equals(tk.maVaiTro())) {
            throw loiCam("Chức năng này chỉ dành cho thu ngân.");
        }
    }

    private void kiemTraQuanLy(TaiKhoan tk) {
        if (!"ADMIN".equals(tk.maVaiTro())
                && !"MANAGER".equals(tk.maVaiTro())) {
            throw loiCam("Bạn không có quyền đối soát phiên thu ngân.");
        }

        if ("MANAGER".equals(tk.maVaiTro()) && tk.idChiNhanh() == null) {
            throw loiCam("Tài khoản cửa hàng trưởng chưa được gán chi nhánh.");
        }
    }

    private void kiemTraChiNhanhPhien(long idPhien, TaiKhoan tk) {
        if ("ADMIN".equals(tk.maVaiTro())) return;

        Long idChiNhanh = jdbc.query("""
                SELECT ca.id_chi_nhanh
                FROM phien_thu_ngan p
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                WHERE p.id = ?
                """, (rs, i) -> rs.getLong("id_chi_nhanh"), idPhien)
                .stream().findFirst().orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Không tìm thấy phiên thu ngân."
                        )
                );

        if (!idChiNhanh.equals(tk.idChiNhanh())) {
            throw loiCam("Bạn không có quyền truy cập phiên của chi nhánh khác.");
        }
    }

    private boolean tienHopLe(BigDecimal tien) {
        return tien != null
                && tien.signum() >= 0
                && tien.stripTrailingZeros().scale() <= 2
                && tien.compareTo(GIOI_HAN_TIEN) <= 0;
    }

    private ResponseStatusException loiNhap(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException loiCam(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    private ResponseStatusException loiTrung(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
