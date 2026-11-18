
package com.pos.backend.taikhoan;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/tai-khoan")
public class TaiKhoanController {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    private static final String SELECT_TAI_KHOAN = """
            SELECT tk.id, tk.id_vai_tro, tk.id_chi_nhanh,
                   tk.ho_ten, tk.ten_dang_nhap, tk.so_dien_thoai, tk.trang_thai,
                   vt.ma_vai_tro, vt.ten_vai_tro, cn.ten_chi_nhanh
            FROM tai_khoan tk
            JOIN vai_tro vt ON vt.id = tk.id_vai_tro
            LEFT JOIN chi_nhanh cn ON cn.id = tk.id_chi_nhanh
            """;

    private static final RowMapper<TaiKhoanResponse> DOC_TAI_KHOAN = (rs, rowNum) ->
            new TaiKhoanResponse(
                    rs.getLong("id"),
                    rs.getLong("id_vai_tro"),
                    rs.getObject("id_chi_nhanh", Long.class),
                    rs.getString("ho_ten"),
                    rs.getString("ten_dang_nhap"),
                    rs.getString("so_dien_thoai"),
                    rs.getString("trang_thai"),
                    rs.getString("ma_vai_tro"),
                    rs.getString("ten_vai_tro"),
                    rs.getString("ten_chi_nhanh")
            );

    public TaiKhoanController(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<TaiKhoanResponse> layDanhSach() {
        return jdbc.query(SELECT_TAI_KHOAN + " ORDER BY tk.id DESC", DOC_TAI_KHOAN);
    }

    // Dữ liệu cho hai ô lựa chọn vai trò và chi nhánh trên form.
    @GetMapping("/tuy-chon")
    public TuyChonTaiKhoan layTuyChon() {
        List<VaiTroOption> vaiTro = jdbc.query("""
                SELECT id, ma_vai_tro, ten_vai_tro
                FROM vai_tro
                WHERE trang_thai = 'DANG_DUNG'
                ORDER BY id
                """, (rs, i) -> new VaiTroOption(
                rs.getLong("id"), rs.getString("ma_vai_tro"), rs.getString("ten_vai_tro")
        ));

        List<ChiNhanhOption> chiNhanh = jdbc.query("""
                SELECT id, ma_chi_nhanh, ten_chi_nhanh
                FROM chi_nhanh
                WHERE trang_thai = 'HOAT_DONG'
                ORDER BY ten_chi_nhanh
                """, (rs, i) -> new ChiNhanhOption(
                rs.getLong("id"), rs.getString("ma_chi_nhanh"), rs.getString("ten_chi_nhanh")
        ));

        return new TuyChonTaiKhoan(vaiTro, chiNhanh);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public TaiKhoanResponse them(@RequestBody TaiKhoanRequest request) {
        DuLieuHopLe tk = kiemTra(request, true);
        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
        String matKhauMaHoa = passwordEncoder.encode(tk.matKhau());

        try {
            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement("""
                        INSERT INTO tai_khoan
                            (id_vai_tro, id_chi_nhanh, ho_ten, ten_dang_nhap,
                             mat_khau, so_dien_thoai, trang_thai)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, Statement.RETURN_GENERATED_KEYS);
                ps.setLong(1, tk.idVaiTro());
                if (tk.idChiNhanh() == null) {
                    ps.setNull(2, java.sql.Types.BIGINT);
                } else {
                    ps.setLong(2, tk.idChiNhanh());
                }
                ps.setString(3, tk.hoTen());
                ps.setString(4, tk.tenDangNhap());
                ps.setString(5, matKhauMaHoa);
                ps.setString(6, tk.soDienThoai());
                ps.setString(7, tk.trangThai());
                return ps;
            }, keyHolder);
        } catch (DataIntegrityViolationException ex) {
            throw loiGhiDuLieu(ex);
        }

        if (keyHolder.getKey() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không nhận được ID tài khoản.");
        }
        return layTheoId(keyHolder.getKey().longValue());
    }

    @PutMapping("/{id}")
    @Transactional
    public TaiKhoanResponse sua(
            @PathVariable long id,
            @RequestBody TaiKhoanRequest request,
            Principal principal
    ) {
        TaiKhoanResponse cu = layTheoId(id);
        DuLieuHopLe tk = kiemTra(request, false);

        // Tránh tự khóa hoặc tự tước quyền quản trị của tài khoản đang đăng nhập.
        if (cu.tenDangNhap().equals(principal.getName())
                && (!"HOAT_DONG".equals(tk.trangThai())
                    || !"ADMIN".equals(tk.maVaiTro())
                    || !cu.tenDangNhap().equals(tk.tenDangNhap()))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể tự khóa, đổi vai trò hoặc đổi tên đăng nhập của tài khoản đang sử dụng."
            );
        }

        try {
            int soDong;
            if (tk.matKhau() == null) {
                soDong = jdbc.update("""
                        UPDATE tai_khoan
                        SET id_vai_tro = ?, id_chi_nhanh = ?, ho_ten = ?,
                            ten_dang_nhap = ?, so_dien_thoai = ?, trang_thai = ?
                        WHERE id = ?
                        """, tk.idVaiTro(), tk.idChiNhanh(), tk.hoTen(),
                        tk.tenDangNhap(), tk.soDienThoai(), tk.trangThai(), id);
            } else {
                soDong = jdbc.update("""
                        UPDATE tai_khoan
                        SET id_vai_tro = ?, id_chi_nhanh = ?, ho_ten = ?,
                            ten_dang_nhap = ?, so_dien_thoai = ?, trang_thai = ?,
                            mat_khau = ?
                        WHERE id = ?
                        """, tk.idVaiTro(), tk.idChiNhanh(), tk.hoTen(),
                        tk.tenDangNhap(), tk.soDienThoai(), tk.trangThai(),
                        passwordEncoder.encode(tk.matKhau()), id);
            }
            if (soDong == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản.");
            }
        } catch (DataIntegrityViolationException ex) {
            throw loiGhiDuLieu(ex);
        }

        return layTheoId(id);
    }

    private TaiKhoanResponse layTheoId(long id) {
        return jdbc.query(SELECT_TAI_KHOAN + " WHERE tk.id = ?", DOC_TAI_KHOAN, id)
                .stream().findFirst().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
    }

    private DuLieuHopLe kiemTra(TaiKhoanRequest request, boolean taoMoi) {
        if (request == null) throw loiNhap("Thiếu dữ liệu tài khoản.");
        if (request.idVaiTro() == null || request.idVaiTro() <= 0) {
            throw loiNhap("Vui lòng chọn vai trò.");
        }

        List<String> maVaiTro = jdbc.query("""
                SELECT ma_vai_tro FROM vai_tro
                WHERE id = ? AND trang_thai = 'DANG_DUNG'
                """, (rs, i) -> rs.getString("ma_vai_tro"), request.idVaiTro());
        if (maVaiTro.isEmpty() || !Set.of("ADMIN", "MANAGER", "CASHIER").contains(maVaiTro.get(0))) {
            throw loiNhap("Vai trò không hợp lệ hoặc đã ngừng dùng.");
        }

        String ma = maVaiTro.get(0);
        Long idChiNhanh = request.idChiNhanh();
        if ("ADMIN".equals(ma)) {
            idChiNhanh = null;
        } else {
            if (idChiNhanh == null || idChiNhanh <= 0) {
                throw loiNhap("Vui lòng chọn chi nhánh cho nhân viên.");
            }
            Integer soLuong = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM chi_nhanh
                    WHERE id = ? AND trang_thai = 'HOAT_DONG'
                    """, Integer.class, idChiNhanh);
            if (soLuong == null || soLuong == 0) {
                throw loiNhap("Chi nhánh không tồn tại hoặc đã ngừng hoạt động.");
            }
        }

        String trangThai = batBuoc(request.trangThai(), "Trạng thái", 20);
        if (!Set.of("HOAT_DONG", "BI_KHOA").contains(trangThai)) {
            throw loiNhap("Trạng thái tài khoản không hợp lệ.");
        }

        String matKhau = request.matKhau();
        if (matKhau == null || matKhau.isEmpty()) {
            if (taoMoi) throw loiNhap("Vui lòng nhập mật khẩu ban đầu.");
            matKhau = null; // Sửa mà bỏ trống: giữ nguyên mật khẩu cũ.
        } else {
            int byteCount = matKhau.getBytes(StandardCharsets.UTF_8).length;
            if (matKhau.length() < 8 || byteCount > 72) {
                throw loiNhap("Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte UTF-8.");
            }
        }

        return new DuLieuHopLe(
                request.idVaiTro(), idChiNhanh, ma,
                batBuoc(request.hoTen(), "Họ tên", 255),
                batBuoc(request.tenDangNhap(), "Tên đăng nhập", 100),
                matKhau,
                tuyChon(request.soDienThoai(), "Số điện thoại", 20),
                trangThai
        );
    }

    private String batBuoc(String value, String ten, int gioiHan) {
        if (value == null || value.isBlank()) throw loiNhap("Vui lòng nhập " + ten.toLowerCase() + ".");
        String ketQua = value.strip();
        if (ketQua.length() > gioiHan) throw loiNhap(ten + " tối đa " + gioiHan + " ký tự.");
        return ketQua;
    }

    private String tuyChon(String value, String ten, int gioiHan) {
        if (value == null || value.isBlank()) return null;
        String ketQua = value.strip();
        if (ketQua.length() > gioiHan) throw loiNhap(ten + " tối đa " + gioiHan + " ký tự.");
        return ketQua;
    }

    private ResponseStatusException loiNhap(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException loiGhiDuLieu(DataIntegrityViolationException ex) {
        if (ex instanceof DuplicateKeyException) {
            return new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại.", ex);
        }
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không lưu được dữ liệu tài khoản.", ex);
    }

    public record TaiKhoanRequest(
            Long idVaiTro, Long idChiNhanh, String hoTen, String tenDangNhap,
            String matKhau, String soDienThoai, String trangThai
    ) {}

    private record DuLieuHopLe(
            Long idVaiTro, Long idChiNhanh, String maVaiTro,
            String hoTen, String tenDangNhap, String matKhau,
            String soDienThoai, String trangThai
    ) {}

    public record TaiKhoanResponse(
            long id, long idVaiTro, Long idChiNhanh,
            String hoTen, String tenDangNhap, String soDienThoai, String trangThai,
            String maVaiTro, String tenVaiTro, String tenChiNhanh
    ) {}

    public record VaiTroOption(long id, String maVaiTro, String tenVaiTro) {}
    public record ChiNhanhOption(long id, String maChiNhanh, String tenChiNhanh) {}
    public record TuyChonTaiKhoan(List<VaiTroOption> vaiTro, List<ChiNhanhOption> chiNhanh) {}
}
