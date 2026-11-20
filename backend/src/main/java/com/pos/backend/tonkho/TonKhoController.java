
package com.pos.backend.tonkho;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ton-kho")
public class TonKhoController {

    private final JdbcTemplate jdbc;

    public TonKhoController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record TonKhoResponse(
            long id,
            long idChiNhanh,
            String tenChiNhanh,
            long idSanPham,
            String maSanPham,
            String maVach,
            String tenSanPham,
            String donViTinh,
            BigDecimal giaBan,
            int soLuongHienCo,
            Integer nguongCanhBao,
            LocalDateTime thoiGianCapNhat,
            String trangThaiSanPham
    ) {}

    public record BienDongResponse(
            long id,
            long idTonKho,
            String tenChiNhanh,
            String maSanPham,
            String tenSanPham,
            String loaiBienDong,
            int soLuongThayDoi,
            String maChungTu,
            String lyDo,
            String tenNguoiThucHien,
            LocalDateTime thoiGianTao
    ) {}

    private record NguoiDung(
            long id,
            String maVaiTro,
            Long idChiNhanh
    ) {}

    @GetMapping
    public List<TonKhoResponse> layDanhSach(
            Principal principal,
            Long idChiNhanh
    ) {
        NguoiDung nguoiDung = layNguoiDung(principal);

        Long idLoc = kiemTraPhamVi(nguoiDung, idChiNhanh);

        return jdbc.query("""
                SELECT k.id,
                       k.id_chi_nhanh,
                       cn.ten_chi_nhanh,
                       k.id_san_pham,
                       sp.ma_san_pham,
                       sp.ma_vach,
                       sp.ten_san_pham,
                       sp.don_vi_tinh,
                       sp.gia_ban,
                       k.so_luong_hien_co,
                       k.nguong_canh_bao,
                       k.thoi_gian_cap_nhat,
                       sp.trang_thai AS trang_thai_san_pham
                FROM ton_kho k
                JOIN chi_nhanh cn ON cn.id = k.id_chi_nhanh
                JOIN san_pham sp ON sp.id = k.id_san_pham
                WHERE (? IS NULL OR k.id_chi_nhanh = ?)
                ORDER BY cn.ten_chi_nhanh,
                         sp.ten_san_pham,
                         k.id
                """, (rs, i) -> new TonKhoResponse(
                rs.getLong("id"),
                rs.getLong("id_chi_nhanh"),
                rs.getString("ten_chi_nhanh"),
                rs.getLong("id_san_pham"),
                rs.getString("ma_san_pham"),
                rs.getString("ma_vach"),
                rs.getString("ten_san_pham"),
                rs.getString("don_vi_tinh"),
                rs.getBigDecimal("gia_ban"),
                rs.getInt("so_luong_hien_co"),
                (Integer) rs.getObject("nguong_canh_bao"),
                rs.getTimestamp("thoi_gian_cap_nhat").toLocalDateTime(),
                rs.getString("trang_thai_san_pham")
        ), idLoc, idLoc);
    }

    @GetMapping("/bien-dong")
    public List<BienDongResponse> layLichSuBienDong(
            Principal principal,
            Long idChiNhanh
    ) {
        NguoiDung nguoiDung = layNguoiDung(principal);

        Long idLoc = kiemTraPhamVi(nguoiDung, idChiNhanh);

        return jdbc.query("""
                SELECT bd.id,
                       bd.id_ton_kho,
                       cn.ten_chi_nhanh,
                       sp.ma_san_pham,
                       sp.ten_san_pham,
                       bd.loai_bien_dong,
                       bd.so_luong_thay_doi,
                       bd.ma_chung_tu,
                       bd.ly_do,
                       tk.ho_ten AS ten_nguoi_thuc_hien,
                       bd.thoi_gian_tao
                FROM bien_dong_kho bd
                JOIN ton_kho k ON k.id = bd.id_ton_kho
                JOIN chi_nhanh cn ON cn.id = k.id_chi_nhanh
                JOIN san_pham sp ON sp.id = k.id_san_pham
                LEFT JOIN tai_khoan tk
                       ON tk.id = bd.id_nguoi_thuc_hien
                WHERE (? IS NULL OR k.id_chi_nhanh = ?)
                ORDER BY bd.thoi_gian_tao DESC, bd.id DESC
                LIMIT 100
                """, (rs, i) -> new BienDongResponse(
                rs.getLong("id"),
                rs.getLong("id_ton_kho"),
                rs.getString("ten_chi_nhanh"),
                rs.getString("ma_san_pham"),
                rs.getString("ten_san_pham"),
                rs.getString("loai_bien_dong"),
                rs.getInt("so_luong_thay_doi"),
                rs.getString("ma_chung_tu"),
                rs.getString("ly_do"),
                rs.getString("ten_nguoi_thuc_hien"),
                rs.getTimestamp("thoi_gian_tao").toLocalDateTime()
        ), idLoc, idLoc);
    }

    private NguoiDung layNguoiDung(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn cần đăng nhập."
            );
        }

        return jdbc.query("""
                SELECT tk.id,
                       vt.ma_vai_tro,
                       tk.id_chi_nhanh
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                WHERE tk.ten_dang_nhap = ?
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND vt.trang_thai = 'DANG_DUNG'
                """, (rs, i) -> new NguoiDung(
                rs.getLong("id"),
                rs.getString("ma_vai_tro"),
                rs.getObject("id_chi_nhanh", Long.class)
        ), principal.getName()).stream().findFirst().orElseThrow(
                () -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Tài khoản không hợp lệ."
                )
        );
    }

    private Long kiemTraPhamVi(
            NguoiDung nguoiDung,
            Long idChiNhanh
    ) {
        if ("MANAGER".equals(nguoiDung.maVaiTro())) {
            if (nguoiDung.idChiNhanh() == null) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Tài khoản chưa được gán chi nhánh."
                );
            }

            if (idChiNhanh != null
                    && !idChiNhanh.equals(nguoiDung.idChiNhanh())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Bạn chỉ được xem tồn kho chi nhánh của mình."
                );
            }

            return nguoiDung.idChiNhanh();
        }

        if ("ADMIN".equals(nguoiDung.maVaiTro())) {
            if (idChiNhanh != null) {
                Integer tonTai = jdbc.queryForObject(
                        "SELECT COUNT(*) FROM chi_nhanh WHERE id = ?",
                        Integer.class,
                        idChiNhanh
                );

                if (tonTai == null || tonTai == 0) {
                    throw new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Không tìm thấy chi nhánh."
                    );
                }
            }

            return idChiNhanh;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Bạn không có quyền xem tồn kho."
        );
    }
}
