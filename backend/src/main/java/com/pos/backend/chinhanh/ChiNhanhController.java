package com.pos.backend.chinhanh;

import java.sql.Statement;
import java.util.List;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
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
@RequestMapping("/api/chi-nhanh")
public class ChiNhanhController {

    private static final String SELECT_CHI_NHANH = """
            SELECT id, ma_chi_nhanh, ten_chi_nhanh, dia_chi,
                   so_dien_thoai, trang_thai
            FROM chi_nhanh
            """;

    private static final RowMapper<ChiNhanhResponse> DOC_CHI_NHANH = (rs, rowNum) ->
            new ChiNhanhResponse(
                    rs.getLong("id"),
                    rs.getString("ma_chi_nhanh"),
                    rs.getString("ten_chi_nhanh"),
                    rs.getString("dia_chi"),
                    rs.getString("so_dien_thoai"),
                    rs.getString("trang_thai")
            );

    private final JdbcTemplate jdbc;

    public ChiNhanhController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<ChiNhanhResponse> layDanhSach() {
        return jdbc.query(SELECT_CHI_NHANH + " ORDER BY id DESC", DOC_CHI_NHANH);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ChiNhanhResponse them(@RequestBody ChiNhanhRequest request) {
        ChiNhanhRequest duLieu = kiemTra(request);
        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();

        try {
            jdbc.update(connection -> {
                var statement = connection.prepareStatement("""
                        INSERT INTO chi_nhanh
                            (ma_chi_nhanh, ten_chi_nhanh, dia_chi, so_dien_thoai, trang_thai)
                        VALUES (?, ?, ?, ?, 'HOAT_DONG')
                        """, Statement.RETURN_GENERATED_KEYS);
                statement.setString(1, duLieu.maChiNhanh());
                statement.setString(2, duLieu.tenChiNhanh());
                statement.setString(3, duLieu.diaChi());
                statement.setString(4, duLieu.soDienThoai());
                return statement;
            }, keyHolder);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã chi nhánh đã tồn tại.", ex);
        }

        Number id = keyHolder.getKey();
        if (id == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Không nhận được ID chi nhánh."
            );
        }
        return layTheoId(id.longValue());
    }

    @PutMapping("/{id}")
    @Transactional
    public ChiNhanhResponse sua(@PathVariable long id, @RequestBody ChiNhanhRequest request) {
        ChiNhanhRequest duLieu = kiemTra(request);

        try {
            jdbc.update("""
                    UPDATE chi_nhanh
                    SET ma_chi_nhanh = ?, ten_chi_nhanh = ?, dia_chi = ?, so_dien_thoai = ?
                    WHERE id = ?
                    """, duLieu.maChiNhanh(), duLieu.tenChiNhanh(),
                    duLieu.diaChi(), duLieu.soDienThoai(), id);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã chi nhánh đã tồn tại.", ex);
        }

        return layTheoId(id);
    }

    private ChiNhanhResponse layTheoId(long id) {
        return jdbc.query(SELECT_CHI_NHANH + " WHERE id = ?", DOC_CHI_NHANH, id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh."
                ));
    }

    private ChiNhanhRequest kiemTra(ChiNhanhRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu dữ liệu chi nhánh.");
        }

        String soDienThoai = request.soDienThoai();
        return new ChiNhanhRequest(
                batBuoc(request.maChiNhanh(), "Mã chi nhánh", 50),
                batBuoc(request.tenChiNhanh(), "Tên chi nhánh", 255),
                batBuoc(request.diaChi(), "Địa chỉ", 500),
                soDienThoai == null || soDienThoai.isBlank()
                        ? null
                        : batBuoc(soDienThoai, "Số điện thoại", 20)
        );
    }

    private String batBuoc(String giaTri, String tenTruong, int gioiHan) {
        if (giaTri == null || giaTri.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, tenTruong + " không được để trống."
            );
        }

        String ketQua = giaTri.strip();
        if (ketQua.length() > gioiHan) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, tenTruong + " tối đa " + gioiHan + " ký tự."
            );
        }
        return ketQua;
    }

    public record ChiNhanhRequest(
            String maChiNhanh, String tenChiNhanh, String diaChi, String soDienThoai
    ) {}

    public record ChiNhanhResponse(
            long id, String maChiNhanh, String tenChiNhanh,
            String diaChi, String soDienThoai, String trangThai
    ) {}
}