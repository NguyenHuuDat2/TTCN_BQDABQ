package com.pos.backend.xacthuc;

import java.security.Principal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/xac-thuc")
public class XacThucController {

    private final JdbcTemplate jdbc;

    public XacThucController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/csrf")
    public MaCsrf layCsrf(CsrfToken token) {
        return new MaCsrf(token.getHeaderName(), token.getToken());
    }

    @GetMapping("/toi")
    public TaiKhoanHienTai layTaiKhoan(Principal principal) {
        String sql = """
                SELECT tk.id, tk.ten_dang_nhap, tk.ho_ten,
                       vt.ma_vai_tro, vt.ten_vai_tro,
                       tk.id_chi_nhanh, cn.ten_chi_nhanh
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                LEFT JOIN chi_nhanh cn ON cn.id = tk.id_chi_nhanh
                WHERE tk.ten_dang_nhap = ?
                """;

        return jdbc.queryForObject(sql, (rs, rowNum) ->
                new TaiKhoanHienTai(
                        rs.getLong("id"),
                        rs.getString("ten_dang_nhap"),
                        rs.getString("ho_ten"),
                        rs.getString("ma_vai_tro"),
                        rs.getString("ten_vai_tro"),
                        rs.getObject("id_chi_nhanh", Long.class),
                        rs.getString("ten_chi_nhanh")
                ),
                principal.getName()
        );
    }

    public record MaCsrf(String headerName, String token) {}

    public record TaiKhoanHienTai(
            long id,
            String tenDangNhap,
            String hoTen,
            String maVaiTro,
            String tenVaiTro,
            Long idChiNhanh,
            String tenChiNhanh
    ) {}
}