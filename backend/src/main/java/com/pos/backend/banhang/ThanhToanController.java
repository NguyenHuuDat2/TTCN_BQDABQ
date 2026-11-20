package com.pos.backend.banhang;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    private static final BigDecimal GIA_TRI_MOT_DIEM = new BigDecimal("100");

    private final JdbcTemplate jdbc;

    public ThanhToanController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record KhachHang(
            long id,
            String hoTen,
            String soDienThoai,
            int diemHienCo
    ) {}

    public record KhuyenMai(
            long id,
            String tenChuongTrinh,
            String loaiGiamGia,
            BigDecimal giaTriGiam,
            BigDecimal hoaDonToiThieu,
            BigDecimal giamToiDa
    ) {}

    public record DongMua(long idSanPham, int soLuong, BigDecimal donGia) {}

    public record YeuCau(
            UUID maYeuCau,
            BigDecimal tienKhachDua,
            List<DongMua> gioHang,
            Long idKhachHang,
            Integer soDiemSuDung,
            Long idChuongTrinhKhuyenMai
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
            BigDecimal tongTienHang,
            BigDecimal tongGiamGia,
            BigDecimal tienGiamTuDiem,
            int soDiemSuDung,
            int soDiemDuocCong,
            String tenChuongTrinh,
            BigDecimal tienKhachDua,
            BigDecimal tienTraLai,
            List<DongBienLai> chiTiet
    ) {}

    public record Loi(String thongBao) {}

    private record ThuNgan(long id, long idChiNhanh) {}

    private record KhachHangKhoa(long id, int diemHienCo) {}

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

    private record ChinhSachDiem(
            long id,
            BigDecimal soTienQuyDoi,
            int soDiemNhan
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
        String sdt = soDienThoai == null ? "" : soDienThoai.strip();
        if (sdt.isEmpty() || sdt.length() > 20) return List.of();

        return jdbc.query("""
                SELECT id, ho_ten, so_dien_thoai, diem_hien_co
                FROM khach_hang
                WHERE so_dien_thoai = ?
                  AND trang_thai = 'HOAT_DONG'
                """, (rs, i) -> new KhachHang(
                rs.getLong("id"),
                rs.getString("ho_ten"),
                rs.getString("so_dien_thoai"),
                rs.getInt("diem_hien_co")
        ), sdt);
    }

    @GetMapping("/khuyen-mai")
    public List<KhuyenMai> layKhuyenMai(Principal principal) {
        ThuNgan thuNgan = layThuNgan(principal.getName());

        return jdbc.query("""
                SELECT km.id,
                       km.ten_chuong_trinh,
                       km.loai_giam_gia,
                       km.gia_tri_giam,
                       km.hoa_don_toi_thieu,
                       km.giam_toi_da
                FROM chuong_trinh_khuyen_mai km
                JOIN ap_dung_khuyen_mai_chi_nhanh ap
                  ON ap.id_chuong_trinh_khuyen_mai = km.id
                WHERE ap.id_chi_nhanh = ?
                  AND km.trang_thai = 'DA_CONG_BO'
                  AND NOW() BETWEEN km.thoi_gian_bat_dau AND km.thoi_gian_ket_thuc
                ORDER BY km.thoi_gian_bat_dau DESC, km.id DESC
                """, (rs, i) -> new KhuyenMai(
                rs.getLong("id"),
                rs.getString("ten_chuong_trinh"),
                rs.getString("loai_giam_gia"),
                rs.getBigDecimal("gia_tri_giam"),
                rs.getBigDecimal("hoa_don_toi_thieu"),
                rs.getBigDecimal("giam_toi_da")
        ), thuNgan.idChiNhanh());
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
                JOIN chi_nhanh cn ON cn.id = tk.id_chi_nhanh
                WHERE tk.ten_dang_nhap = ?
                  AND tk.id_chi_nhanh IS NOT NULL
                  AND tk.trang_thai = 'HOAT_DONG'
                  AND cn.trang_thai = 'HOAT_DONG'
                  AND vt.ma_vai_tro = 'CASHIER'
                  AND vt.trang_thai = 'DANG_DUNG'
                """, (rs, i) -> new ThuNgan(
                rs.getLong("id"),
                rs.getLong("id_chi_nhanh")
        ), tenDangNhap).stream().findFirst().orElseThrow(
                () -> new LoiBanHang("Tài khoản thu ngân chưa hợp lệ hoặc chưa được gán chi nhánh.")
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
                  AND p.trang_thai = 'DANG_MO'
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

    private KhachHangKhoa layKhachHangKhoa(Long idKhachHang) {
        if (idKhachHang == null) return null;

        List<KhachHangKhoa> ds = jdbc.query("""
                SELECT id, diem_hien_co
                FROM khach_hang
                WHERE id = ?
                  AND trang_thai = 'HOAT_DONG'
                FOR UPDATE
                """, (rs, i) -> new KhachHangKhoa(
                rs.getLong("id"),
                rs.getInt("diem_hien_co")
        ), idKhachHang);

        if (ds.isEmpty()) {
            throw new LoiBanHang("Khách hàng không còn hoạt động. Vui lòng chọn lại.");
        }
        return ds.get(0);
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

    private List<KhuyenMai> layKhuyenMaiHieuLuc(long idChiNhanh) {
        return jdbc.query("""
                SELECT km.id,
                       km.ten_chuong_trinh,
                       km.loai_giam_gia,
                       km.gia_tri_giam,
                       km.hoa_don_toi_thieu,
                       km.giam_toi_da
                FROM chuong_trinh_khuyen_mai km
                JOIN ap_dung_khuyen_mai_chi_nhanh ap
                  ON ap.id_chuong_trinh_khuyen_mai = km.id
                WHERE ap.id_chi_nhanh = ?
                  AND km.trang_thai = 'DA_CONG_BO'
                  AND NOW() BETWEEN km.thoi_gian_bat_dau AND km.thoi_gian_ket_thuc
                ORDER BY km.id
                """, (rs, i) -> new KhuyenMai(
                rs.getLong("id"),
                rs.getString("ten_chuong_trinh"),
                rs.getString("loai_giam_gia"),
                rs.getBigDecimal("gia_tri_giam"),
                rs.getBigDecimal("hoa_don_toi_thieu"),
                rs.getBigDecimal("giam_toi_da")
        ), idChiNhanh);
    }

    private BigDecimal tinhMucGiam(KhuyenMai km, BigDecimal tongTienHang) {
        if (km.hoaDonToiThieu() != null
                && tongTienHang.compareTo(km.hoaDonToiThieu()) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal mucGiam;
        if ("PHAN_TRAM".equals(km.loaiGiamGia())) {
            mucGiam = tongTienHang
                    .multiply(km.giaTriGiam())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else if ("SO_TIEN".equals(km.loaiGiamGia())) {
            mucGiam = km.giaTriGiam();
        } else {
            return BigDecimal.ZERO;
        }

        if (km.giamToiDa() != null) {
            mucGiam = mucGiam.min(km.giamToiDa());
        }
        return mucGiam.min(tongTienHang).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private KhuyenMai chonKhuyenMaiTotNhat(long idChiNhanh, BigDecimal tongTienHang) {
        List<KhuyenMai> ds = layKhuyenMaiHieuLuc(idChiNhanh);
        KhuyenMai totNhat = null;
        BigDecimal mucGiamTotNhat = BigDecimal.ZERO;

        for (KhuyenMai km : ds) {
            BigDecimal mucGiam = tinhMucGiam(km, tongTienHang);
            if (mucGiam.compareTo(mucGiamTotNhat) > 0
                    || (mucGiam.compareTo(mucGiamTotNhat) == 0
                    && mucGiam.signum() > 0
                    && (totNhat == null || km.id() < totNhat.id()))) {
                totNhat = km;
                mucGiamTotNhat = mucGiam;
            }
        }
        return totNhat;
    }

    private ChinhSachDiem layChinhSachDiem() {
        return jdbc.query("""
                SELECT id, so_tien_quy_doi, so_diem_nhan
                FROM chinh_sach_tich_diem
                WHERE trang_thai = 'HIEU_LUC'
                  AND thoi_gian_bat_dau <= NOW()
                  AND (thoi_gian_ket_thuc IS NULL OR thoi_gian_ket_thuc >= NOW())
                  AND so_tien_quy_doi > 0
                  AND so_diem_nhan > 0
                ORDER BY thoi_gian_bat_dau DESC, id DESC
                LIMIT 1
                """, (rs, i) -> new ChinhSachDiem(
                rs.getLong("id"),
                rs.getBigDecimal("so_tien_quy_doi"),
                rs.getInt("so_diem_nhan")
        )).stream().findFirst().orElse(null);
    }

    private int tinhDiemDuocCong(BigDecimal tienThucTra, ChinhSachDiem chinhSach) {
        if (chinhSach == null || tienThucTra.signum() <= 0) return 0;

        BigDecimal soLanQuyDoi = tienThucTra.divide(
                chinhSach.soTienQuyDoi(), 0, RoundingMode.DOWN
        );
        return soLanQuyDoi
                .multiply(BigDecimal.valueOf(chinhSach.soDiemNhan()))
                .intValueExact();
    }

    private static int docSoTrongGhiChu(String ghiChu, String khoa) {
        if (ghiChu == null || ghiChu.isBlank()) return 0;
        Pattern pattern = Pattern.compile("(?:^|;)" + Pattern.quote(khoa) + "=(\\d+)(?:;|$)");
        Matcher matcher = pattern.matcher(ghiChu);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : 0;
    }

    private List<DongBienLai> docChiTietBienLai(long idHoaDon) {
        return jdbc.query("""
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
    }

    private BienLai docBienLai(long idHoaDon) {
        List<DongBienLai> chiTiet = docChiTietBienLai(idHoaDon);

        return jdbc.queryForObject("""
                SELECT h.so_hoa_don,
                       DATE_FORMAT(h.thoi_gian_hoan_tat, '%d/%m/%Y %H:%i:%s') AS thoi_gian,
                       cn.ten_chi_nhanh,
                       tk.ho_ten AS ten_thu_ngan,
                       COALESCE(kh.ho_ten, 'Khách lẻ') AS ten_khach_hang,
                       t.phuong_thuc,
                       h.tien_phai_thanh_toan,
                       h.tong_tien_hang,
                       h.tong_giam_gia,
                       COALESCE(t.so_tien_khach_dua, h.tien_phai_thanh_toan) AS tien_khach_dua,
                       COALESCE(t.so_tien_tra_lai, 0) AS tien_tra_lai,
                       COALESCE(km.ten_chuong_trinh, '') AS ten_chuong_trinh,
                       COALESCE(ls.ghi_chu, '') AS ghi_chu_diem
                FROM hoa_don h
                JOIN thanh_toan t ON t.id_hoa_don = h.id
                JOIN phien_thu_ngan p ON p.id = h.id_phien_thu_ngan
                JOIN phan_cong_ca pc ON pc.id = p.id_phan_cong_ca
                JOIN ca_lam_viec ca ON ca.id = pc.id_ca_lam_viec
                JOIN chi_nhanh cn ON cn.id = ca.id_chi_nhanh
                JOIN tai_khoan tk ON tk.id = pc.id_tai_khoan
                LEFT JOIN khach_hang kh ON kh.id = h.id_khach_hang
                LEFT JOIN chuong_trinh_khuyen_mai km ON km.id = h.id_chuong_trinh_khuyen_mai
                LEFT JOIN lich_su_tich_diem ls ON ls.id_hoa_don = h.id
                WHERE h.id = ?
                """, (rs, i) -> {
            String ghiChu = rs.getString("ghi_chu_diem");
            int diemSuDung = docSoTrongGhiChu(ghiChu, "SD");
            int diemDuocCong = docSoTrongGhiChu(ghiChu, "DC");

            return new BienLai(
                    rs.getString("so_hoa_don"),
                    rs.getString("thoi_gian"),
                    rs.getString("ten_chi_nhanh"),
                    rs.getString("ten_thu_ngan"),
                    rs.getString("ten_khach_hang"),
                    rs.getString("phuong_thuc"),
                    rs.getBigDecimal("tien_phai_thanh_toan"),
                    rs.getBigDecimal("tong_tien_hang"),
                    rs.getBigDecimal("tong_giam_gia"),
                    GIA_TRI_MOT_DIEM.multiply(BigDecimal.valueOf(diemSuDung)),
                    diemSuDung,
                    diemDuocCong,
                    rs.getString("ten_chuong_trinh"),
                    rs.getBigDecimal("tien_khach_dua"),
                    rs.getBigDecimal("tien_tra_lai"),
                    chiTiet
            );
        }, idHoaDon);
    }

    private BienLai ghiThanhToan(
            YeuCau yc,
            Principal principal,
            String phuongThuc
    ) {
        boolean laTienMat = "TIEN_MAT".equals(phuongThuc);

        if (yc == null || yc.maYeuCau() == null
                || yc.gioHang() == null || yc.gioHang().isEmpty()
                || (laTienMat && !tienHopLe(yc.tienKhachDua()))
                || (!laTienMat && yc.tienKhachDua() != null && !tienHopLe(yc.tienKhachDua()))
                || (yc.soDiemSuDung() != null && yc.soDiemSuDung() < 0)
                || (yc.idChuongTrinhKhuyenMai() != null && yc.idChuongTrinhKhuyenMai() <= 0)) {
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
                WHERE h.ma_yeu_cau = ?
                  AND t.id_nguoi_xac_nhan = ?
                """, (rs, i) -> rs.getLong("id"), ma, thuNgan.id());

        if (!hoaDonCu.isEmpty()) {
            BienLai cu = docBienLai(hoaDonCu.get(0));
            if (!phuongThuc.equals(cu.phuongThuc())) {
                throw new LoiBanHang("Mã yêu cầu đã dùng cho phương thức khác.");
            }
            return cu;
        }

        long idPhien = layPhienDangMo(thuNgan);
        KhachHangKhoa khachHang = layKhachHangKhoa(yc.idKhachHang());

        BigDecimal tongTienHang = BigDecimal.ZERO;
        List<DongLuu> chiTiet = new ArrayList<>();

        for (DongMua dong : gio.values()) {
            HangTrongKho hang = layHangTrongKho(thuNgan.idChiNhanh(), dong);
            BigDecimal thanhTien = hang.giaBan()
                    .multiply(BigDecimal.valueOf(dong.soLuong()))
                    .setScale(2, RoundingMode.HALF_UP);
            tongTienHang = tongTienHang.add(thanhTien);
            chiTiet.add(new DongLuu(dong, hang, thanhTien));
        }

        if (!tienHopLe(tongTienHang)) {
            throw new LoiBanHang("Tổng tiền hàng không hợp lệ.");
        }

        KhuyenMai khuyenMaiTotNhat = chonKhuyenMaiTotNhat(
                thuNgan.idChiNhanh(), tongTienHang
        );
        Long idKhuyenMaiTotNhat = khuyenMaiTotNhat == null
                ? null
                : khuyenMaiTotNhat.id();

        if (!java.util.Objects.equals(yc.idChuongTrinhKhuyenMai(), idKhuyenMaiTotNhat)) {
            String thongBao = khuyenMaiTotNhat == null
                    ? "Không còn chương trình khuyến mãi hợp lệ cho hóa đơn này. Vui lòng tải lại khuyến mãi."
                    : "Chương trình có mức giảm cao nhất hiện tại là '"
                            + khuyenMaiTotNhat.tenChuongTrinh()
                            + "'. Vui lòng chọn lại trước khi thanh toán.";
            throw new LoiBanHang(thongBao);
        }

        BigDecimal giamKhuyenMai = khuyenMaiTotNhat == null
                ? BigDecimal.ZERO
                : tinhMucGiam(khuyenMaiTotNhat, tongTienHang);

        int diemSuDung = yc.soDiemSuDung() == null ? 0 : yc.soDiemSuDung();
        if (diemSuDung > 0 && khachHang == null) {
            throw new LoiBanHang("Cần chọn khách hàng thành viên trước khi sử dụng điểm.");
        }
        if (khachHang != null && diemSuDung > khachHang.diemHienCo()) {
            throw new LoiBanHang("Số điểm sử dụng vượt quá điểm hiện có của khách hàng.");
        }

        BigDecimal tienSauKhuyenMai = tongTienHang.subtract(giamKhuyenMai);
        BigDecimal giamTuDiem = GIA_TRI_MOT_DIEM.multiply(BigDecimal.valueOf(diemSuDung));
        if (giamTuDiem.compareTo(tienSauKhuyenMai) > 0) {
            throw new LoiBanHang("Số điểm sử dụng vượt quá giá trị hóa đơn còn lại.");
        }

        BigDecimal tongGiamGia = giamKhuyenMai.add(giamTuDiem);
        BigDecimal tienPhaiThanhToan = tongTienHang.subtract(tongGiamGia)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal tienNhan = laTienMat
                ? yc.tienKhachDua()
                : tienPhaiThanhToan;

        if (!tienHopLe(tienNhan) || tienNhan.compareTo(tienPhaiThanhToan) < 0) {
            throw new LoiBanHang("Tiền khách đưa chưa đủ số tiền phải thanh toán.");
        }

        BigDecimal tienTraLai = laTienMat
                ? tienNhan.subtract(tienPhaiThanhToan)
                : BigDecimal.ZERO;

        ChinhSachDiem chinhSach = layChinhSachDiem();
        int diemDuocCong = khachHang == null
                ? 0
                : tinhDiemDuocCong(tienPhaiThanhToan, chinhSach);

        long diemMoi = khachHang == null
                ? 0
                : (long) khachHang.diemHienCo() - diemSuDung + diemDuocCong;
        if (diemMoi < 0 || diemMoi > Integer.MAX_VALUE) {
            throw new LoiBanHang("Số dư điểm thành viên vượt giới hạn cho phép.");
        }

        String soHoaDon = "HD-" + ma;
        jdbc.update("""
                INSERT INTO hoa_don
                    (so_hoa_don, id_phien_thu_ngan, id_khach_hang,
                     id_chuong_trinh_khuyen_mai, tong_tien_hang, tong_giam_gia,
                     tien_phai_thanh_toan, trang_thai, ma_yeu_cau,
                     thoi_gian_tao, thoi_gian_hoan_tat)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'DA_THANH_TOAN', ?, NOW(), NOW())
                """, soHoaDon, idPhien, yc.idKhachHang(), idKhuyenMaiTotNhat,
                tongTienHang, tongGiamGia, tienPhaiThanhToan, ma);

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

            int soDongCapNhat = jdbc.update("""
                    UPDATE ton_kho
                    SET so_luong_hien_co = so_luong_hien_co - ?,
                        thoi_gian_cap_nhat = NOW()
                    WHERE id = ?
                      AND so_luong_hien_co >= ?
                    """, dong.soLuong(), item.hang().idKho(), dong.soLuong());

            if (soDongCapNhat != 1) {
                throw new LoiBanHang(
                        item.hang().tenSanPham() + " không còn đủ tồn kho. Vui lòng tải lại giỏ hàng."
                );
            }

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
                """, idHoaDon, phuongThuc, tienPhaiThanhToan,
                tienNhan, tienTraLai, thuNgan.id());

        if (khachHang != null && (diemSuDung > 0 || diemDuocCong > 0)) {
            jdbc.update("""
                    UPDATE khach_hang
                    SET diem_hien_co = ?
                    WHERE id = ?
                    """, (int) diemMoi, khachHang.id());

            int diemThayDoi = diemDuocCong - diemSuDung;
            String ghiChu = "SD=" + diemSuDung
                    + ";DC=" + diemDuocCong
                    + ";GD=" + giamTuDiem.toPlainString();

            jdbc.update("""
                    INSERT INTO lich_su_tich_diem
                        (id_khach_hang, id_hoa_don, id_chinh_sach_tich_diem,
                         so_diem_cong, thoi_gian_tao, ghi_chu)
                    VALUES (?, ?, ?, ?, NOW(), ?)
                    """, khachHang.id(), idHoaDon,
                    chinhSach == null ? null : chinhSach.id(),
                    diemThayDoi, ghiChu);
        }

        return docBienLai(idHoaDon);
    }
}
