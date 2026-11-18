package com.pos.backend.banhang;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ban-hang")
public class ThanhToanController {

    private final JdbcTemplate jdbc;

    public ThanhToanController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record KhachHang(long id, String hoTen, String soDienThoai) {}

    public record DongMua(long idSanPham, int soLuong, BigDecimal donGia) {}

    public record YeuCau(
            UUID maYeuCau,
            BigDecimal tienKhachDua,
            List<DongMua> gioHang,
            Long idKhachHang
    ) {}

    public record DongBienLai(
            String tenSanPham,
            int soLuong,
            BigDecimal donGia,
            BigDecimal thanhTien
    ) {}

    public record BienLai(
            String soHoaDon,
            String thoiGian,
            String tenChiNhanh,
            String tenThuNgan,
            String tenKhachHang,
            String phuongThuc,
            BigDecimal tongTien,
            BigDecimal tienKhachDua,
            BigDecimal tienTraLai,
            List<DongBienLai> chiTiet
    ) {}

    public record Loi(String thongBao) {}

    private record ThuNgan(long id, long idChiNhanh) {}

    private record HangTrongKho(
            long idKho,
            String tenSanPham,
            BigDecimal giaBan,
            int ton
    ) {}

    private record DongLuu(
            DongMua dong,
            HangTrongKho hang,
            BigDecimal thanhTien
    ) {}

    private static class LoiBanHang extends RuntimeException {
        LoiBanHang(String message) {
            super(message);
        }
    }

    @ExceptionHandler(LoiBanHang.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Loi baoLoi(LoiBanHang ex) {
        return new Loi(ex.getMessage());
    }

    @GetMapping("/khach-hang")
    public List<KhachHang> timKhachHang(
            @RequestParam("soDienThoai") String soDienThoai
    ) {
        String sdt = soDienThoai.strip();
        if (sdt.isEmpty() || sdt.length() > 20) return List.of();

        return jdbc.query("""
                SELECT id, ho_ten, so_dien_thoai
                FROM khach_hang
                WHERE so_dien_thoai = ? AND trang_thai = 'HOAT_DONG'
                """, (rs, i) -> new KhachHang(
                rs.getLong("id"),
                rs.getString("ho_ten"),
                rs.getString("so_dien_thoai")
        ), sdt);
    }

    @PostMapping("/tien-mat")
    @Transactional
    public BienLai thanhToanTienMat(
            @RequestBody YeuCau yeuCau,
            Principal principal
    ) {
        return ghiThanhToan(yeuCau, principal, "TIEN_MAT");
    }

    @PostMapping("/qr")
    @Transactional
    public BienLai thanhToanQr(
            @RequestBody YeuCau yeuCau,
            Principal principal
    ) {
        return ghiThanhToan(yeuCau, principal, "QR");
    }

    private static boolean tienHopLe(BigDecimal tien) {
        return tien != null
                && tien.signum() >= 0
                && tien.stripTrailingZeros().scale() <= 2
                && tien.compareTo(new BigDecimal("10000000000000000")) < 0;
    }

    private ThuNgan layThuNgan(String tenDangNhap) {
        return jdbc.query("""
                SELECT tk.id, tk.id_chi_nhanh
                FROM tai_khoan tk
                JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                WHERE tk.ten_dang_nhap = ?
                  AND tk.id_chi_nhanh IS NOT NULL
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND vt.ma_vai_tro = 'CASHIER'
                  AND vt.trang_thai = 'DANG_DUNG'
                FOR UPDATE
                """, (rs, i) -> new ThuNgan(
                rs.getLong("id"),
                rs.getLong("id_chi_nhanh")
        ), tenDangNhap).stream().findFirst().orElseThrow(
                () -> new LoiBanHang("Tài khoản thu ngân chưa hợp lệ.")
        );
    }

    private long layPhienDangMo(ThuNgan thuNgan) {
        List<Long> phien = jdbc.query("""
                SELECT p.id
                FROM phien_thu_ngan p
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                WHERE pc.id_tai_khoan = ?
                  AND ca.id_chi_nhanh = ?
                  AND p.thoi_gian_dong IS NULL
                FOR UPDATE
                """, (rs, i) -> rs.getLong("id"),
                thuNgan.id(), thuNgan.idChiNhanh());

        if (phien.isEmpty()) {
            throw new LoiBanHang("Bạn cần mở phiên thu ngân trước khi thanh toán.");
        }
        if (phien.size() > 1) {
            throw new LoiBanHang("Có nhiều phiên thu ngân đang mở. Vui lòng kiểm tra ca.");
        }
        return phien.get(0);
    }

    private void kiemTraKhachHang(Long idKhachHang) {
        if (idKhachHang == null) return;

        List<Long> khach = jdbc.query("""
                SELECT id
                FROM khach_hang
                WHERE id = ? AND trang_thai = 'HOAT_DONG'
                FOR UPDATE
                """, (rs, i) -> rs.getLong("id"), idKhachHang);

        if (khach.isEmpty()) {
            throw new LoiBanHang("Khách hàng không còn hoạt động. Vui lòng chọn lại.");
        }
    }

    private HangTrongKho layHangTrongKho(long idChiNhanh, DongMua dong) {
        List<HangTrongKho> ds = jdbc.query("""
                SELECT k.id, sp.ten_san_pham, sp.gia_ban, k.so_luong_hien_co
                FROM ton_kho k
                JOIN san_pham sp ON sp.id = k.id_san_pham
                WHERE k.id_chi_nhanh = ?
                  AND sp.id = ?
                  AND sp.trang_thai = 'DANG_DUNG'
                FOR UPDATE
                """, (rs, i) -> new HangTrongKho(
                rs.getLong("id"),
                rs.getString("ten_san_pham"),
                rs.getBigDecimal("gia_ban"),
                rs.getInt("so_luong_hien_co")
        ), idChiNhanh, dong.idSanPham());

        if (ds.size() != 1) {
            throw new LoiBanHang(
                    "Kiểm tra sản phẩm và tồn kho tại chi nhánh, ID "
                            + dong.idSanPham() + "."
            );
        }

        HangTrongKho hang = ds.get(0);

        if (hang.giaBan().compareTo(dong.donGia()) != 0) {
            throw new LoiBanHang(
                    "Giá " + hang.tenSanPham()
                            + " đã thay đổi. Vui lòng tải lại giá và cập nhật giỏ."
            );
        }

        if (hang.ton() < dong.soLuong()) {
            throw new LoiBanHang(
                    hang.tenSanPham() + " chỉ còn " + hang.ton() + " trong kho."
            );
        }

        return hang;
    }

    private BienLai docBienLai(long idHoaDon) {
        List<DongBienLai> chiTiet = jdbc.query("""
                SELECT sp.ten_san_pham, ct.so_luong, ct.don_gia, ct.thanh_tien
                FROM chi_tiet_hoa_don ct
                JOIN san_pham sp ON sp.id = ct.id_san_pham
                WHERE ct.id_hoa_don = ?
                ORDER BY ct.id
                """, (rs, i) -> new DongBienLai(
                rs.getString("ten_san_pham"),
                rs.getInt("so_luong"),
                rs.getBigDecimal("don_gia"),
                rs.getBigDecimal("thanh_tien")
        ), idHoaDon);

        return jdbc.queryForObject("""
                SELECT h.so_hoa_don,
                       DATE_FORMAT(h.thoi_gian_hoan_tat, '%d/%m/%Y %H:%i:%s') AS thoi_gian,
                       cn.ten_chi_nhanh,
                       tk.ho_ten AS ten_thu_ngan,
                       COALESCE(kh.ho_ten, 'Khách lẻ') AS ten_khach_hang,
                       t.phuong_thuc,
                       h.tien_phai_thanh_toan,
                       t.so_tien_khach_dua,
                       t.so_tien_tra_lai
                FROM hoa_don h
                JOIN thanh_toan t ON t.id_hoa_don = h.id
                JOIN phien_thu_ngan p ON p.id = h.id_phien_thu_ngan
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                JOIN chi_nhanh cn ON cn.id = ca.id_chi_nhanh
                JOIN tai_khoan tk ON tk.id = pc.id_tai_khoan
                LEFT JOIN khach_hang kh ON kh.id = h.id_khach_hang
                WHERE h.id = ?
                """, (rs, i) -> new BienLai(
                rs.getString("so_hoa_don"),
                rs.getString("thoi_gian"),
                rs.getString("ten_chi_nhanh"),
                rs.getString("ten_thu_ngan"),
                rs.getString("ten_khach_hang"),
                rs.getString("phuong_thuc"),
                rs.getBigDecimal("tien_phai_thanh_toan"),
                rs.getBigDecimal("so_tien_khach_dua"),
                rs.getBigDecimal("so_tien_tra_lai"),
                chiTiet
        ), idHoaDon);
    }

    private BienLai ghiThanhToan(
            YeuCau yc,
            Principal principal,
            String phuongThuc
    ) {
        boolean laTienMat = "TIEN_MAT".equals(phuongThuc);

        if (yc == null || yc.maYeuCau() == null
                || yc.gioHang() == null || yc.gioHang().isEmpty()
                || (laTienMat && !tienHopLe(yc.tienKhachDua()))) {
            throw new LoiBanHang("Dữ liệu thanh toán chưa hợp lệ.");
        }

        var gio = new TreeMap<Long, DongMua>();

        for (DongMua dong : yc.gioHang()) {
            if (dong == null || dong.idSanPham() <= 0 || dong.soLuong() <= 0
                    || !tienHopLe(dong.donGia())
                    || gio.put(dong.idSanPham(), dong) != null) {
                throw new LoiBanHang("Kiểm tra lại sản phẩm, đơn giá và số lượng.");
            }
        }

        ThuNgan thuNgan = layThuNgan(principal.getName());
        String ma = yc.maYeuCau().toString();

        List<Long> hoaDonCu = jdbc.query("""
                SELECT h.id
                FROM hoa_don h
                JOIN thanh_toan t ON t.id_hoa_don = h.id
                WHERE h.ma_yeu_cau = ? AND t.id_nguoi_xac_nhan = ?
                """, (rs, i) -> rs.getLong("id"), ma, thuNgan.id());

        if (!hoaDonCu.isEmpty()) {
            BienLai cu = docBienLai(hoaDonCu.get(0));
            if (!phuongThuc.equals(cu.phuongThuc())) {
                throw new LoiBanHang("Mã yêu cầu đã dùng cho phương thức khác.");
            }
            return cu;
        }

        long idPhien = layPhienDangMo(thuNgan);
        kiemTraKhachHang(yc.idKhachHang());

        BigDecimal tong = BigDecimal.ZERO;
        List<DongLuu> chiTiet = new ArrayList<>();

        for (DongMua dong : gio.values()) {
            HangTrongKho hang = layHangTrongKho(thuNgan.idChiNhanh(), dong);
            BigDecimal thanhTien = hang.giaBan()
                    .multiply(BigDecimal.valueOf(dong.soLuong()));

            tong = tong.add(thanhTien);
            chiTiet.add(new DongLuu(dong, hang, thanhTien));
        }

        BigDecimal tienNhan = laTienMat ? yc.tienKhachDua() : tong;

        if (!tienHopLe(tong) || tienNhan.compareTo(tong) < 0) {
            throw new LoiBanHang("Tổng tiền chưa hợp lệ hoặc tiền khách đưa chưa đủ.");
        }

        BigDecimal traLai = tienNhan.subtract(tong);
        String soHoaDon = "HD-" + ma;

        jdbc.update("""
                INSERT INTO hoa_don
                    (so_hoa_don, id_phien_thu_ngan, id_khach_hang,
                     tong_tien_hang, tong_giam_gia, tien_phai_thanh_toan,
                     trang_thai, ma_yeu_cau, thoi_gian_tao, thoi_gian_hoan_tat)
                VALUES (?, ?, ?, ?, 0, ?, 'DA_THANH_TOAN', ?, NOW(), NOW())
                """, soHoaDon, idPhien, yc.idKhachHang(), tong, tong, ma);

        Long idHoaDon = jdbc.queryForObject(
                "SELECT id FROM hoa_don WHERE ma_yeu_cau = ?",
                Long.class,
                ma
        );

        for (DongLuu item : chiTiet) {
            DongMua dong = item.dong();

            jdbc.update("""
                    INSERT INTO chi_tiet_hoa_don
                        (id_hoa_don, id_san_pham, so_luong, don_gia, thanh_tien)
                    VALUES (?, ?, ?, ?, ?)
                    """, idHoaDon, dong.idSanPham(), dong.soLuong(),
                    item.hang().giaBan(), item.thanhTien());

            jdbc.update("""
                    UPDATE ton_kho
                    SET so_luong_hien_co = so_luong_hien_co - ?,
                        thoi_gian_cap_nhat = NOW()
                    WHERE id = ?
                    """, dong.soLuong(), item.hang().idKho());

            jdbc.update("""
                    INSERT INTO bien_dong_kho
                        (id_ton_kho, loai_bien_dong, so_luong_thay_doi,
                         ma_chung_tu, id_nguoi_thuc_hien, thoi_gian_tao)
                    VALUES (?, 'BAN_HANG', ?, ?, ?, NOW())
                    """, item.hang().idKho(), -dong.soLuong(),
                    soHoaDon, thuNgan.id());
        }

        jdbc.update("""
                INSERT INTO thanh_toan
                    (id_hoa_don, phuong_thuc, so_tien_thanh_toan, so_tien_khach_dua,
                     so_tien_tra_lai, trang_thai, id_nguoi_xac_nhan, thoi_gian_xac_nhan)
                VALUES (?, ?, ?, ?, ?, 'DA_XAC_NHAN', ?, NOW())
                """, idHoaDon, phuongThuc, tong, tienNhan, traLai, thuNgan.id());

        return docBienLai(idHoaDon);
    }
}