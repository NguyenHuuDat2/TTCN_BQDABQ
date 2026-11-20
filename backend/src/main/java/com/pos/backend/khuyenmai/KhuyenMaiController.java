package com.pos.backend.khuyenmai;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/khuyen-mai")
public class KhuyenMaiController {

    private final JdbcTemplate jdbc;

    public KhuyenMaiController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record KhuyenMaiRequest(
            String tenChuongTrinh,
            String loaiGiamGia,
            BigDecimal giaTriGiam,
            BigDecimal hoaDonToiThieu,
            BigDecimal giamToiDa,
            LocalDateTime thoiGianBatDau,
            LocalDateTime thoiGianKetThuc,
            List<Long> idChiNhanh
    ) {}

    public record KhuyenMaiResponse(
            long id,
            String tenChuongTrinh,
            String loaiGiamGia,
            BigDecimal giaTriGiam,
            BigDecimal hoaDonToiThieu,
            BigDecimal giamToiDa,
            LocalDateTime thoiGianBatDau,
            LocalDateTime thoiGianKetThuc,
            String trangThai,
            List<Long> idChiNhanh
    ) {}

    private record KhuyenMaiCoBan(
            long id,
            String tenChuongTrinh,
            String loaiGiamGia,
            BigDecimal giaTriGiam,
            BigDecimal hoaDonToiThieu,
            BigDecimal giamToiDa,
            LocalDateTime thoiGianBatDau,
            LocalDateTime thoiGianKetThuc,
            String trangThai
    ) {}

    @GetMapping
    public List<KhuyenMaiResponse> layDanhSach() {
        List<KhuyenMaiCoBan> ds = jdbc.query("""
                SELECT id,
                       ten_chuong_trinh,
                       loai_giam_gia,
                       gia_tri_giam,
                       hoa_don_toi_thieu,
                       giam_toi_da,
                       thoi_gian_bat_dau,
                       thoi_gian_ket_thuc,
                       trang_thai
                FROM chuong_trinh_khuyen_mai
                ORDER BY thoi_gian_bat_dau DESC, id DESC
                """, (rs, i) -> new KhuyenMaiCoBan(
                rs.getLong("id"),
                rs.getString("ten_chuong_trinh"),
                rs.getString("loai_giam_gia"),
                rs.getBigDecimal("gia_tri_giam"),
                rs.getBigDecimal("hoa_don_toi_thieu"),
                rs.getBigDecimal("giam_toi_da"),
                rs.getTimestamp("thoi_gian_bat_dau").toLocalDateTime(),
                rs.getTimestamp("thoi_gian_ket_thuc").toLocalDateTime(),
                rs.getString("trang_thai")
        ));

        Map<Long, List<Long>> chiNhanhTheoKhuyenMai = docChiNhanhTheoKhuyenMai();
        List<KhuyenMaiResponse> ketQua = new ArrayList<>();

        for (KhuyenMaiCoBan km : ds) {
            ketQua.add(new KhuyenMaiResponse(
                    km.id(),
                    km.tenChuongTrinh(),
                    km.loaiGiamGia(),
                    km.giaTriGiam(),
                    km.hoaDonToiThieu(),
                    km.giamToiDa(),
                    km.thoiGianBatDau(),
                    km.thoiGianKetThuc(),
                    km.trangThai(),
                    chiNhanhTheoKhuyenMai.getOrDefault(km.id(), List.of())
            ));
        }
        return ketQua;
    }

    @PostMapping
    @Transactional
    public KhuyenMaiResponse taoKhuyenMai(
            @RequestBody KhuyenMaiRequest request,
            Principal principal
    ) {
        kiemTraYeuCau(request);
        List<Long> idChiNhanh = kiemTraChiNhanh(request.idChiNhanh());

        jdbc.update("""
                INSERT INTO chuong_trinh_khuyen_mai
                    (ten_chuong_trinh, loai_giam_gia, gia_tri_giam,
                     hoa_don_toi_thieu, giam_toi_da,
                     thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'BAN_NHAP')
                """,
                request.tenChuongTrinh().strip(),
                request.loaiGiamGia(),
                request.giaTriGiam(),
                request.hoaDonToiThieu(),
                request.giamToiDa(),
                request.thoiGianBatDau(),
                request.thoiGianKetThuc()
        );

        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        luuChiNhanh(id, idChiNhanh);
        ghiLichSu(principal, "TAO_KHUYEN_MAI", id, "Tạo chương trình " + request.tenChuongTrinh().strip() + ".");
        return docKhuyenMai(id);
    }

    @PutMapping("/{id}")
    @Transactional
    public KhuyenMaiResponse capNhatKhuyenMai(
            @PathVariable long id,
            @RequestBody KhuyenMaiRequest request,
            Principal principal
    ) {
        kiemTraYeuCau(request);
        List<Long> idChiNhanh = kiemTraChiNhanh(request.idChiNhanh());
        KhuyenMaiCoBan hienTai = layKhuyenMaiKhoa(id);

        if ("NGUNG".equals(hienTai.trangThai())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chương trình đã ngừng áp dụng nên không thể chỉnh sửa."
            );
        }
        if ("DA_CONG_BO".equals(hienTai.trangThai())
                && !hienTai.thoiGianBatDau().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chương trình đã bắt đầu hoặc đang áp dụng, không thể sửa nội dung."
            );
        }

        jdbc.update("""
                UPDATE chuong_trinh_khuyen_mai
                SET ten_chuong_trinh = ?,
                    loai_giam_gia = ?,
                    gia_tri_giam = ?,
                    hoa_don_toi_thieu = ?,
                    giam_toi_da = ?,
                    thoi_gian_bat_dau = ?,
                    thoi_gian_ket_thuc = ?
                WHERE id = ?
                """,
                request.tenChuongTrinh().strip(),
                request.loaiGiamGia(),
                request.giaTriGiam(),
                request.hoaDonToiThieu(),
                request.giamToiDa(),
                request.thoiGianBatDau(),
                request.thoiGianKetThuc(),
                id
        );

        luuChiNhanh(id, idChiNhanh);
        if ("DA_CONG_BO".equals(hienTai.trangThai())) {
            guiThongBao(id, "Chương trình khuyến mãi đã cập nhật",
                    "Chương trình '" + request.tenChuongTrinh().strip() + "' đã được cập nhật thông tin áp dụng.");
        }
        ghiLichSu(principal, "SUA_KHUYEN_MAI", id, "Cập nhật chương trình " + request.tenChuongTrinh().strip() + ".");
        return docKhuyenMai(id);
    }

    @PostMapping("/{id}/cong-bo")
    @Transactional
    public KhuyenMaiResponse congBoKhuyenMai(
            @PathVariable long id,
            Principal principal
    ) {
        KhuyenMaiCoBan km = layKhuyenMaiKhoa(id);
        if (!"BAN_NHAP".equals(km.trangThai())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ chương trình ở trạng thái Bản nháp mới được công bố."
            );
        }
        if (!km.thoiGianBatDau().isBefore(km.thoiGianKetThuc())
                || !km.thoiGianKetThuc().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Thời gian chương trình không hợp lệ hoặc đã kết thúc."
            );
        }

        List<Long> idChiNhanh = docIdChiNhanh(id);
        if (idChiNhanh.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chương trình chưa được gán chi nhánh áp dụng."
            );
        }

        int soDong = jdbc.update("""
                UPDATE chuong_trinh_khuyen_mai
                SET trang_thai = 'DA_CONG_BO'
                WHERE id = ? AND trang_thai = 'BAN_NHAP'
                """, id);
        if (soDong != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chương trình đã được xử lý bởi thao tác khác."
            );
        }

        guiThongBao(id, "Khuyến mãi mới: " + km.tenChuongTrinh(),
                "Chương trình bắt đầu " + km.thoiGianBatDau()
                        + " và kết thúc " + km.thoiGianKetThuc() + ".");
        ghiLichSu(principal, "CONG_BO_KHUYEN_MAI", id, "Công bố chương trình " + km.tenChuongTrinh() + ".");
        return docKhuyenMai(id);
    }

    @PostMapping("/{id}/ngung")
    @Transactional
    public KhuyenMaiResponse ngungKhuyenMai(
            @PathVariable long id,
            Principal principal
    ) {
        KhuyenMaiCoBan km = layKhuyenMaiKhoa(id);
        if (!"DA_CONG_BO".equals(km.trangThai())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ chương trình đã công bố mới có thể ngừng áp dụng."
            );
        }

        int soDong = jdbc.update("""
                UPDATE chuong_trinh_khuyen_mai
                SET trang_thai = 'NGUNG'
                WHERE id = ? AND trang_thai = 'DA_CONG_BO'
                """, id);
        if (soDong != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể ngừng chương trình này."
            );
        }

        guiThongBao(id, "Chương trình khuyến mãi đã ngừng",
                "Chương trình '" + km.tenChuongTrinh() + "' đã được ngừng áp dụng.");
        ghiLichSu(principal, "NGUNG_KHUYEN_MAI", id, "Ngừng chương trình " + km.tenChuongTrinh() + ".");
        return docKhuyenMai(id);
    }

    private void kiemTraYeuCau(KhuyenMaiRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu dữ liệu chương trình khuyến mãi.");
        }

        String ten = request.tenChuongTrinh() == null ? "" : request.tenChuongTrinh().strip();
        if (ten.isBlank() || ten.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên chương trình phải có từ 1 đến 255 ký tự.");
        }

        if (!"PHAN_TRAM".equals(request.loaiGiamGia())
                && !"SO_TIEN".equals(request.loaiGiamGia())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại giảm giá không hợp lệ.");
        }

        if (request.giaTriGiam() == null || request.giaTriGiam().signum() <= 0
                || ("PHAN_TRAM".equals(request.loaiGiamGia())
                && request.giaTriGiam().compareTo(new BigDecimal("100")) > 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá trị giảm giá không hợp lệ.");
        }

        if (request.hoaDonToiThieu() != null && request.hoaDonToiThieu().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hóa đơn tối thiểu không được âm.");
        }
        if (request.giamToiDa() != null && request.giamToiDa().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mức giảm tối đa phải lớn hơn 0.");
        }
        if (request.thoiGianBatDau() == null || request.thoiGianKetThuc() == null
                || !request.thoiGianBatDau().isBefore(request.thoiGianKetThuc())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian bắt đầu phải trước thời gian kết thúc.");
        }
    }

    private List<Long> kiemTraChiNhanh(List<Long> dsNhap) {
        if (dsNhap == null || dsNhap.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chọn ít nhất một chi nhánh áp dụng.");
        }

        Set<Long> duyNhat = new HashSet<>();
        for (Long id : dsNhap) {
            if (id == null || id <= 0 || !duyNhat.add(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách chi nhánh không hợp lệ hoặc bị trùng.");
            }
        }

        String placeholders = String.join(",", java.util.Collections.nCopies(duyNhat.size(), "?"));
        List<Object> thamSo = new ArrayList<>(duyNhat);
        Integer soChiNhanh = jdbc.queryForObject(
                "SELECT COUNT(*) FROM chi_nhanh WHERE trang_thai = 'HOAT_DONG' AND id IN (" + placeholders + ")",
                Integer.class,
                thamSo.toArray()
        );
        if (soChiNhanh == null || soChiNhanh != duyNhat.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Có chi nhánh không tồn tại hoặc đã ngừng hoạt động.");
        }
        return new ArrayList<>(duyNhat);
    }

    private void luuChiNhanh(long idKhuyenMai, List<Long> idChiNhanh) {
        jdbc.update(
                "DELETE FROM ap_dung_khuyen_mai_chi_nhanh WHERE id_chuong_trinh_khuyen_mai = ?",
                idKhuyenMai
        );
        for (Long id : idChiNhanh) {
            jdbc.update("""
                    INSERT INTO ap_dung_khuyen_mai_chi_nhanh
                        (id_chuong_trinh_khuyen_mai, id_chi_nhanh)
                    VALUES (?, ?)
                    """, idKhuyenMai, id);
        }
    }

    private Map<Long, List<Long>> docChiNhanhTheoKhuyenMai() {
        Map<Long, List<Long>> ketQua = new HashMap<>();
        jdbc.query("""
                SELECT id_chuong_trinh_khuyen_mai, id_chi_nhanh
                FROM ap_dung_khuyen_mai_chi_nhanh
                ORDER BY id_chuong_trinh_khuyen_mai, id_chi_nhanh
                """, rs -> {
            long idKhuyenMai = rs.getLong("id_chuong_trinh_khuyen_mai");
            ketQua.computeIfAbsent(idKhuyenMai, k -> new ArrayList<>())
                    .add(rs.getLong("id_chi_nhanh"));
        });
        return ketQua;
    }

    private List<Long> docIdChiNhanh(long idKhuyenMai) {
        return jdbc.query("""
                SELECT id_chi_nhanh
                FROM ap_dung_khuyen_mai_chi_nhanh
                WHERE id_chuong_trinh_khuyen_mai = ?
                ORDER BY id_chi_nhanh
                """, (rs, i) -> rs.getLong("id_chi_nhanh"), idKhuyenMai);
    }

    private KhuyenMaiCoBan layKhuyenMaiKhoa(long id) {
        return jdbc.query("""
                SELECT id,
                       ten_chuong_trinh,
                       loai_giam_gia,
                       gia_tri_giam,
                       hoa_don_toi_thieu,
                       giam_toi_da,
                       thoi_gian_bat_dau,
                       thoi_gian_ket_thuc,
                       trang_thai
                FROM chuong_trinh_khuyen_mai
                WHERE id = ?
                FOR UPDATE
                """, (rs, i) -> new KhuyenMaiCoBan(
                rs.getLong("id"),
                rs.getString("ten_chuong_trinh"),
                rs.getString("loai_giam_gia"),
                rs.getBigDecimal("gia_tri_giam"),
                rs.getBigDecimal("hoa_don_toi_thieu"),
                rs.getBigDecimal("giam_toi_da"),
                rs.getTimestamp("thoi_gian_bat_dau").toLocalDateTime(),
                rs.getTimestamp("thoi_gian_ket_thuc").toLocalDateTime(),
                rs.getString("trang_thai")
        ), id).stream().findFirst().orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chương trình khuyến mãi.")
        );
    }

    private KhuyenMaiResponse docKhuyenMai(long id) {
        KhuyenMaiCoBan km = jdbc.query("""
                SELECT id,
                       ten_chuong_trinh,
                       loai_giam_gia,
                       gia_tri_giam,
                       hoa_don_toi_thieu,
                       giam_toi_da,
                       thoi_gian_bat_dau,
                       thoi_gian_ket_thuc,
                       trang_thai
                FROM chuong_trinh_khuyen_mai
                WHERE id = ?
                """, (rs, i) -> new KhuyenMaiCoBan(
                rs.getLong("id"),
                rs.getString("ten_chuong_trinh"),
                rs.getString("loai_giam_gia"),
                rs.getBigDecimal("gia_tri_giam"),
                rs.getBigDecimal("hoa_don_toi_thieu"),
                rs.getBigDecimal("giam_toi_da"),
                rs.getTimestamp("thoi_gian_bat_dau").toLocalDateTime(),
                rs.getTimestamp("thoi_gian_ket_thuc").toLocalDateTime(),
                rs.getString("trang_thai")
        ), id).stream().findFirst().orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chương trình khuyến mãi.")
        );

        return new KhuyenMaiResponse(
                km.id(), km.tenChuongTrinh(), km.loaiGiamGia(), km.giaTriGiam(),
                km.hoaDonToiThieu(), km.giamToiDa(), km.thoiGianBatDau(),
                km.thoiGianKetThuc(), km.trangThai(), docIdChiNhanh(id)
        );
    }

    private void guiThongBao(long idKhuyenMai, String tieuDe, String noiDung) {
        jdbc.update("""
                INSERT INTO thong_bao
                    (id_tai_khoan_nhan, tieu_de, noi_dung, loai_thong_bao,
                     doi_tuong_lien_quan, id_doi_tuong_lien_quan, thoi_gian_tao)
                SELECT DISTINCT tk.id, ?, ?, 'KHUYEN_MAI',
                       'chuong_trinh_khuyen_mai', ?, NOW()
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                JOIN ap_dung_khuyen_mai_chi_nhanh ap ON ap.id_chi_nhanh = tk.id_chi_nhanh
                WHERE ap.id_chuong_trinh_khuyen_mai = ?
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND vt.trang_thai = 'DANG_DUNG'
                  AND vt.ma_vai_tro IN ('MANAGER', 'CASHIER')
                """, tieuDe, noiDung, idKhuyenMai, idKhuyenMai);
    }

    private void ghiLichSu(
            Principal principal,
            String loaiThaoTac,
            long idKhuyenMai,
            String noiDung
    ) {
        Long idTaiKhoan = jdbc.queryForObject(
                "SELECT id FROM tai_khoan WHERE ten_dang_nhap = ? AND trang_thai = 'HOAT_DONG'",
                Long.class,
                principal.getName()
        );

        jdbc.update("""
                INSERT INTO lich_su_thao_tac
                    (id_tai_khoan, loai_thao_tac, doi_tuong_tac_dong,
                     id_doi_tuong, noi_dung_thay_doi, thoi_gian_tao)
                VALUES (?, ?, 'chuong_trinh_khuyen_mai', ?, ?, NOW())
                """, idTaiKhoan, loaiThaoTac, idKhuyenMai, noiDung);
    }
}
