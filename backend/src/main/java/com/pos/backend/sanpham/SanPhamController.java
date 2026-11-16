package com.pos.backend.sanpham;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/san-pham")
public class SanPhamController {

    private final JdbcTemplate jdbc;

    private static final String SELECT_SAN_PHAM = """
            SELECT id, id_danh_muc, ma_san_pham, ten_san_pham,
                   ma_vach, don_vi_tinh, gia_ban, trang_thai
            FROM san_pham
            """;

    private static final RowMapper<SanPhamResponse> DOC_SAN_PHAM = (rs, rowNum) ->
            new SanPhamResponse(
                    rs.getLong("id"),
                    rs.getLong("id_danh_muc"),
                    rs.getString("ma_san_pham"),
                    rs.getString("ten_san_pham"),
                    rs.getString("ma_vach"),
                    rs.getString("don_vi_tinh"),
                    rs.getBigDecimal("gia_ban"),
                    rs.getString("trang_thai")
            );

    public SanPhamController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<SanPhamResponse> layDanhSach() {
        return jdbc.query(
                SELECT_SAN_PHAM + " ORDER BY ma_san_pham",
                DOC_SAN_PHAM
        );
    }

    @GetMapping("/tra-ma-vach")
    public SanPhamResponse traMaVach(@RequestParam("maVach") String maVach) {
        String ma = batBuoc(maVach, "Mã vạch", 100);

        return jdbc.query(
                SELECT_SAN_PHAM + " WHERE ma_vach = ?",
                DOC_SAN_PHAM,
                ma
        ).stream().findFirst().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có sản phẩm mang mã vạch này.")
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SanPhamResponse them(@RequestBody SanPhamRequest request) {
        SanPhamRequest sp = kiemTra(request);

        try {
            jdbc.update("""
                    INSERT INTO san_pham
                        (id_danh_muc, ma_san_pham, ten_san_pham, ma_vach,
                         don_vi_tinh, gia_ban, trang_thai)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    sp.idDanhMuc(), sp.maSanPham(), sp.tenSanPham(), sp.maVach(),
                    sp.donViTinh(), sp.giaBan(), sp.trangThai()
            );
        } catch (DataIntegrityViolationException ex) {
            throw loiGhiDuLieu(ex);
        }

        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return layTheoId(id);
    }

    @PutMapping("/{id}")
    @Transactional
    public SanPhamResponse sua(
            @PathVariable("id") long id,
            @RequestBody SanPhamRequest request
    ) {
        SanPhamRequest sp = kiemTra(request);

        try {
            jdbc.update("""
                    UPDATE san_pham
                    SET id_danh_muc = ?, ma_san_pham = ?, ten_san_pham = ?,
                        ma_vach = ?, don_vi_tinh = ?, gia_ban = ?, trang_thai = ?
                    WHERE id = ?
                    """,
                    sp.idDanhMuc(), sp.maSanPham(), sp.tenSanPham(), sp.maVach(),
                    sp.donViTinh(), sp.giaBan(), sp.trangThai(), id
            );
        } catch (DataIntegrityViolationException ex) {
            throw loiGhiDuLieu(ex);
        }

        return layTheoId(id);
    }

    private SanPhamResponse layTheoId(long id) {
        return jdbc.query(
                SELECT_SAN_PHAM + " WHERE id = ?",
                DOC_SAN_PHAM,
                id
        ).stream().findFirst().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm.")
        );
    }

    private SanPhamRequest kiemTra(SanPhamRequest sp) {
        if (sp.idDanhMuc() == null || sp.idDanhMuc() <= 0) {
            throw loiNhap("Vui lòng chọn danh mục.");
        }

        BigDecimal gia = sp.giaBan();
        if (gia == null || gia.signum() < 0
                || gia.compareTo(new BigDecimal("9999999999999999.99")) > 0
                || gia.stripTrailingZeros().scale() > 2) {
            throw loiNhap("Giá bán phải từ 0 trở lên và có tối đa 2 chữ số thập phân.");
        }

        String maVach = sp.maVach() == null ? null : sp.maVach().strip();
        if (maVach != null && maVach.isEmpty()) maVach = null;
        if (maVach != null && maVach.length() > 100) {
            throw loiNhap("Mã vạch tối đa 100 ký tự.");
        }

        String trangThai = batBuoc(sp.trangThai(), "Trạng thái", 20);
        if (!List.of("DANG_DUNG", "NGUNG_DUNG").contains(trangThai)) {
            throw loiNhap("Trạng thái sản phẩm không hợp lệ.");
        }

        return new SanPhamRequest(
                sp.idDanhMuc(),
                batBuoc(sp.maSanPham(), "Mã sản phẩm", 50),
                batBuoc(sp.tenSanPham(), "Tên sản phẩm", 255),
                maVach,
                batBuoc(sp.donViTinh(), "Đơn vị tính", 50),
                gia,
                trangThai
        );
    }

    private String batBuoc(String value, String tenTruong, int doDai) {
        if (value == null || value.isBlank()) {
            throw loiNhap("Vui lòng nhập " + tenTruong.toLowerCase() + ".");
        }
        String text = value.strip();
        if (text.length() > doDai) {
            throw loiNhap(tenTruong + " tối đa " + doDai + " ký tự.");
        }
        return text;
    }

    private ResponseStatusException loiNhap(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException loiGhiDuLieu(DataIntegrityViolationException ex) {
        if (ex instanceof DuplicateKeyException) {
            return new ResponseStatusException(
                    HttpStatus.CONFLICT, "Mã sản phẩm hoặc mã vạch đã tồn tại.", ex
            );
        }
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Kiểm tra lại danh mục và dữ liệu sản phẩm.", ex
        );
    }

    public record SanPhamRequest(
            Long idDanhMuc,
            String maSanPham,
            String tenSanPham,
            String maVach,
            String donViTinh,
            BigDecimal giaBan,
            String trangThai
    ) {}

    public record SanPhamResponse(
            Long id,
            Long idDanhMuc,
            String maSanPham,
            String tenSanPham,
            String maVach,
            String donViTinh,
            BigDecimal giaBan,
            String trangThai
    ) {}
}