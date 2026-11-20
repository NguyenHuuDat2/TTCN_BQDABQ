package com.pos.backend.khachhang;

import java.security.Principal;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/khach-hang")
public class KhachHangController {

    private static final Pattern SO_DIEN_THOAI = Pattern.compile("\\+?[0-9]{7,20}");

    private final JdbcTemplate jdbc;

    public KhachHangController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record KhachHangRequest(String hoTen, String soDienThoai) {}

    public record TrangThaiRequest(String trangThai) {}

    public record KhachHangResponse(
            long id,
            String hoTen,
            String soDienThoai,
            int diemHienCo,
            String ngayDangKy,
            String trangThai
    ) {}

    public record LichSuDiemResponse(
            String soHoaDon,
            String thoiGian,
            int soDiemThayDoi,
            String ghiChu
    ) {}

    @GetMapping
    public List<KhachHangResponse> layDanhSach(
            @RequestParam(required = false, defaultValue = "") String tuKhoa
    ) {
        String tuKhoaTim = tuKhoa == null ? "" : tuKhoa.strip();
        String mauTim = "%" + tuKhoaTim + "%";

        return jdbc.query("""
                SELECT id,
                       ho_ten,
                       so_dien_thoai,
                       diem_hien_co,
                       DATE_FORMAT(ngay_dang_ky, '%d/%m/%Y %H:%i') AS ngay_dang_ky,
                       trang_thai
                FROM khach_hang
                WHERE (? = '' OR ho_ten LIKE ? OR so_dien_thoai LIKE ?)
                ORDER BY ngay_dang_ky DESC, id DESC
                LIMIT 200
                """, (rs, i) -> new KhachHangResponse(
                rs.getLong("id"),
                rs.getString("ho_ten"),
                rs.getString("so_dien_thoai"),
                rs.getInt("diem_hien_co"),
                rs.getString("ngay_dang_ky"),
                rs.getString("trang_thai")
        ), tuKhoaTim, mauTim, mauTim);
    }

    @GetMapping("/{id}")
    public KhachHangResponse layChiTiet(@PathVariable long id) {
        return docKhachHang(id);
    }

    @GetMapping("/{id}/lich-su-diem")
    public List<LichSuDiemResponse> layLichSuDiem(@PathVariable long id) {
        kiemTraKhachHangTonTai(id);

        return jdbc.query("""
                SELECT h.so_hoa_don,
                       DATE_FORMAT(ls.thoi_gian_tao, '%d/%m/%Y %H:%i:%s') AS thoi_gian,
                       ls.so_diem_cong,
                       COALESCE(ls.ghi_chu, '') AS ghi_chu
                FROM lich_su_tich_diem ls
                JOIN hoa_don h ON h.id = ls.id_hoa_don
                WHERE ls.id_khach_hang = ?
                ORDER BY ls.thoi_gian_tao DESC, ls.id DESC
                """, (rs, i) -> new LichSuDiemResponse(
                rs.getString("so_hoa_don"),
                rs.getString("thoi_gian"),
                rs.getInt("so_diem_cong"),
                rs.getString("ghi_chu")
        ), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public KhachHangResponse taoKhachHang(
            @RequestBody KhachHangRequest request,
            Principal principal
    ) {
        String hoTen = chuanHoaHoTen(request == null ? null : request.hoTen());
        String sdt = chuanHoaSoDienThoai(request == null ? null : request.soDienThoai());

        Integer daTonTai = jdbc.queryForObject(
                "SELECT COUNT(*) FROM khach_hang WHERE so_dien_thoai = ?",
                Integer.class,
                sdt
        );
        if (daTonTai != null && daTonTai > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Số điện thoại đã được đăng ký thành viên."
            );
        }

        jdbc.update("""
                INSERT INTO khach_hang
                    (ho_ten, so_dien_thoai, diem_hien_co, ngay_dang_ky, trang_thai)
                VALUES (?, ?, 0, NOW(), 'HOAT_DONG')
                """, hoTen, sdt);

        Long id = jdbc.queryForObject(
                "SELECT id FROM khach_hang WHERE so_dien_thoai = ?",
                Long.class,
                sdt
        );

        ghiLichSu(principal, "TAO_MOI", id, "Tạo khách hàng thành viên " + hoTen + ".");
        return docKhachHang(id);
    }

    @PutMapping("/{id}")
    @Transactional
    public KhachHangResponse capNhatKhachHang(
            @PathVariable long id,
            @RequestBody KhachHangRequest request,
            Principal principal
    ) {
        kiemTraKhachHangTonTai(id);

        String hoTen = chuanHoaHoTen(request == null ? null : request.hoTen());
        String sdt = chuanHoaSoDienThoai(request == null ? null : request.soDienThoai());

        Integer trungSo = jdbc.queryForObject(
                "SELECT COUNT(*) FROM khach_hang WHERE so_dien_thoai = ? AND id <> ?",
                Integer.class,
                sdt,
                id
        );
        if (trungSo != null && trungSo > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Số điện thoại đã thuộc về khách hàng khác."
            );
        }

        jdbc.update("""
                UPDATE khach_hang
                SET ho_ten = ?, so_dien_thoai = ?
                WHERE id = ?
                """, hoTen, sdt, id);

        ghiLichSu(principal, "CAP_NHAT", id, "Cập nhật thông tin khách hàng " + hoTen + ".");
        return docKhachHang(id);
    }

    @PatchMapping("/{id}/trang-thai")
    @Transactional
    public KhachHangResponse capNhatTrangThai(
            @PathVariable long id,
            @RequestBody TrangThaiRequest request,
            Principal principal
    ) {
        kiemTraKhachHangTonTai(id);

        String trangThai = request == null || request.trangThai() == null
                ? ""
                : request.trangThai().strip().toUpperCase();
        if (!"HOAT_DONG".equals(trangThai) && !"BI_KHOA".equals(trangThai)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái khách hàng không hợp lệ."
            );
        }

        jdbc.update(
                "UPDATE khach_hang SET trang_thai = ? WHERE id = ?",
                trangThai,
                id
        );

        ghiLichSu(
                principal,
                "CAP_NHAT_TRANG_THAI",
                id,
                "Chuyển trạng thái khách hàng thành " + trangThai + "."
        );
        return docKhachHang(id);
    }

    private String chuanHoaHoTen(String value) {
        String hoTen = value == null ? "" : value.strip().replaceAll("\\s+", " ");
        if (hoTen.isBlank() || hoTen.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Họ tên khách hàng phải có từ 1 đến 255 ký tự."
            );
        }
        return hoTen;
    }

    private String chuanHoaSoDienThoai(String value) {
        String sdt = value == null ? "" : value.strip().replaceAll("[\\s().-]", "");
        if (!SO_DIEN_THOAI.matcher(sdt).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điện thoại phải có từ 7 đến 20 chữ số, có thể bắt đầu bằng dấu +."
            );
        }
        return sdt;
    }

    private void kiemTraKhachHangTonTai(long id) {
        Integer soLuong = jdbc.queryForObject(
                "SELECT COUNT(*) FROM khach_hang WHERE id = ?",
                Integer.class,
                id
        );
        if (soLuong == null || soLuong == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy khách hàng."
            );
        }
    }

    private KhachHangResponse docKhachHang(long id) {
        return jdbc.query("""
                SELECT id,
                       ho_ten,
                       so_dien_thoai,
                       diem_hien_co,
                       DATE_FORMAT(ngay_dang_ky, '%d/%m/%Y %H:%i') AS ngay_dang_ky,
                       trang_thai
                FROM khach_hang
                WHERE id = ?
                """, (rs, i) -> new KhachHangResponse(
                rs.getLong("id"),
                rs.getString("ho_ten"),
                rs.getString("so_dien_thoai"),
                rs.getInt("diem_hien_co"),
                rs.getString("ngay_dang_ky"),
                rs.getString("trang_thai")
        ), id).stream().findFirst().orElseThrow(
                () -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy khách hàng."
                )
        );
    }

    private void ghiLichSu(
            Principal principal,
            String loaiThaoTac,
            long idKhachHang,
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
                VALUES (?, ?, 'khach_hang', ?, ?, NOW())
                """, idTaiKhoan, loaiThaoTac, idKhachHang, noiDung);
    }
}
