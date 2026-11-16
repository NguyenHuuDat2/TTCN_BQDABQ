

-- 1. Cấu trúc CSDL
CREATE TABLE vai_tro (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_vai_tro VARCHAR(50) NOT NULL UNIQUE,
    ten_vai_tro VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    trang_thai VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_nhanh (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_chi_nhanh VARCHAR(50) NOT NULL UNIQUE,
    ten_chi_nhanh VARCHAR(255) NOT NULL,
    dia_chi VARCHAR(500) NOT NULL,
    so_dien_thoai VARCHAR(20),
    trang_thai VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tai_khoan (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_vai_tro BIGINT UNSIGNED NOT NULL,
    id_chi_nhanh BIGINT UNSIGNED,
    ho_ten VARCHAR(255) NOT NULL,
    ten_dang_nhap VARCHAR(100) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    so_dien_thoai VARCHAR(20),
    trang_thai VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_vai_tro) REFERENCES vai_tro(id),
    FOREIGN KEY (id_chi_nhanh) REFERENCES chi_nhanh(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE danh_muc_san_pham (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_danh_muc VARCHAR(50) NOT NULL UNIQUE,
    ten_danh_muc VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    trang_thai VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE san_pham (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_danh_muc BIGINT UNSIGNED NOT NULL,
    ma_san_pham VARCHAR(50) NOT NULL UNIQUE,
    ma_vach VARCHAR(100) UNIQUE,
    ten_san_pham VARCHAR(255) NOT NULL,
    don_vi_tinh VARCHAR(50) NOT NULL,
    gia_ban DECIMAL(18,2) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_danh_muc) REFERENCES danh_muc_san_pham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ton_kho (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_chi_nhanh BIGINT UNSIGNED NOT NULL,
    id_san_pham BIGINT UNSIGNED NOT NULL,
    so_luong_hien_co INT NOT NULL,
    nguong_canh_bao INT,
    thoi_gian_cap_nhat DATETIME NOT NULL,
    FOREIGN KEY (id_chi_nhanh) REFERENCES chi_nhanh(id),
    FOREIGN KEY (id_san_pham) REFERENCES san_pham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bien_dong_kho (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ton_kho BIGINT UNSIGNED NOT NULL,
    loai_bien_dong VARCHAR(30) NOT NULL,
    so_luong_thay_doi INT NOT NULL,
    ma_chung_tu VARCHAR(100),
    ly_do VARCHAR(255),
    id_nguoi_thuc_hien BIGINT UNSIGNED,
    thoi_gian_tao DATETIME NOT NULL,
    FOREIGN KEY (id_ton_kho) REFERENCES ton_kho(id),
    FOREIGN KEY (id_nguoi_thuc_hien) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ca_lam_viec (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_chi_nhanh BIGINT UNSIGNED NOT NULL,
    ngay_lam_viec DATE NOT NULL,
    loai_ca VARCHAR(20) NOT NULL,
    gio_bat_dau DATETIME NOT NULL,
    gio_ket_thuc DATETIME NOT NULL,
    trang_thai VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_chi_nhanh) REFERENCES chi_nhanh(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE phan_cong_ca (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ca_lam_viec BIGINT UNSIGNED NOT NULL,
    id_tai_khoan BIGINT UNSIGNED NOT NULL,
    nhiem_vu VARCHAR(50) NOT NULL,
    ghi_chu VARCHAR(255),
    FOREIGN KEY (id_ca_lam_viec) REFERENCES ca_lam_viec(id),
    FOREIGN KEY (id_tai_khoan) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE phien_thu_ngan (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_phan_cong_ca BIGINT UNSIGNED NOT NULL,
    thoi_gian_mo DATETIME NOT NULL,
    thoi_gian_dong DATETIME,
    tien_dau_ca DECIMAL(18,2) NOT NULL,
    tien_du_kien_cuoi_ca DECIMAL(18,2),
    tien_thuc_te DECIMAL(18,2),
    tien_chenh_lech DECIMAL(18,2),
    trang_thai VARCHAR(30) NOT NULL,
    id_nguoi_doi_soat BIGINT UNSIGNED,
    thoi_gian_doi_soat DATETIME,
    FOREIGN KEY (id_phan_cong_ca) REFERENCES phan_cong_ca(id),
    FOREIGN KEY (id_nguoi_doi_soat) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE khach_hang (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ho_ten VARCHAR(255) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL UNIQUE,
    diem_hien_co INT NOT NULL,
    ngay_dang_ky DATETIME NOT NULL,
    trang_thai VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chinh_sach_tich_diem (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    so_tien_quy_doi DECIMAL(18,2) NOT NULL,
    so_diem_nhan INT NOT NULL,
    thoi_gian_bat_dau DATETIME NOT NULL,
    thoi_gian_ket_thuc DATETIME,
    trang_thai VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chuong_trinh_khuyen_mai (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ten_chuong_trinh VARCHAR(255) NOT NULL,
    loai_giam_gia VARCHAR(30) NOT NULL,
    gia_tri_giam DECIMAL(18,2) NOT NULL,
    hoa_don_toi_thieu DECIMAL(18,2),
    giam_toi_da DECIMAL(18,2),
    thoi_gian_bat_dau DATETIME NOT NULL,
    thoi_gian_ket_thuc DATETIME NOT NULL,
    trang_thai VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hoa_don (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    so_hoa_don VARCHAR(50) NOT NULL UNIQUE,
    id_phien_thu_ngan BIGINT UNSIGNED NOT NULL,
    id_khach_hang BIGINT UNSIGNED,
    id_chuong_trinh_khuyen_mai BIGINT UNSIGNED,
    tong_tien_hang DECIMAL(18,2) NOT NULL,
    tong_giam_gia DECIMAL(18,2) NOT NULL,
    tien_phai_thanh_toan DECIMAL(18,2) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL,
    ma_yeu_cau VARCHAR(100) NOT NULL UNIQUE,
    thoi_gian_tao DATETIME NOT NULL,
    thoi_gian_hoan_tat DATETIME,
    FOREIGN KEY (id_phien_thu_ngan) REFERENCES phien_thu_ngan(id),
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_chuong_trinh_khuyen_mai) REFERENCES chuong_trinh_khuyen_mai(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lich_su_tich_diem (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_khach_hang BIGINT UNSIGNED NOT NULL,
    id_hoa_don BIGINT UNSIGNED NOT NULL UNIQUE,
    id_chinh_sach_tich_diem BIGINT UNSIGNED,
    so_diem_cong INT NOT NULL,
    thoi_gian_tao DATETIME NOT NULL,
    ghi_chu VARCHAR(255),
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_hoa_don) REFERENCES hoa_don(id),
    FOREIGN KEY (id_chinh_sach_tich_diem) REFERENCES chinh_sach_tich_diem(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ap_dung_khuyen_mai_chi_nhanh (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_chuong_trinh_khuyen_mai BIGINT UNSIGNED NOT NULL,
    id_chi_nhanh BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (id_chuong_trinh_khuyen_mai) REFERENCES chuong_trinh_khuyen_mai(id),
    FOREIGN KEY (id_chi_nhanh) REFERENCES chi_nhanh(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_tiet_hoa_don (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_hoa_don BIGINT UNSIGNED NOT NULL,
    id_san_pham BIGINT UNSIGNED NOT NULL,
    so_luong INT NOT NULL,
    don_gia DECIMAL(18,2) NOT NULL,
    thanh_tien DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (id_hoa_don) REFERENCES hoa_don(id),
    FOREIGN KEY (id_san_pham) REFERENCES san_pham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE thanh_toan (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_hoa_don BIGINT UNSIGNED NOT NULL UNIQUE,
    phuong_thuc VARCHAR(30) NOT NULL,
    so_tien_thanh_toan DECIMAL(18,2) NOT NULL,
    so_tien_khach_dua DECIMAL(18,2),
    so_tien_tra_lai DECIMAL(18,2),
    noi_dung_chuyen_khoan VARCHAR(255),
    trang_thai VARCHAR(20) NOT NULL,
    id_nguoi_xac_nhan BIGINT UNSIGNED,
    thoi_gian_xac_nhan DATETIME,
    FOREIGN KEY (id_hoa_don) REFERENCES hoa_don(id),
    FOREIGN KEY (id_nguoi_xac_nhan) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE phieu_dieu_chuyen (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_phieu VARCHAR(50) NOT NULL UNIQUE,
    id_chi_nhanh_xuat BIGINT UNSIGNED NOT NULL,
    id_chi_nhanh_nhan BIGINT UNSIGNED NOT NULL,
    id_nguoi_tao BIGINT UNSIGNED NOT NULL,
    id_nguoi_duyet BIGINT UNSIGNED,
    trang_thai VARCHAR(30) NOT NULL,
    thoi_gian_tao DATETIME NOT NULL,
    thoi_gian_duyet DATETIME,
    thoi_gian_xuat DATETIME,
    thoi_gian_nhan DATETIME,
    ghi_chu VARCHAR(255),
    FOREIGN KEY (id_chi_nhanh_xuat) REFERENCES chi_nhanh(id),
    FOREIGN KEY (id_chi_nhanh_nhan) REFERENCES chi_nhanh(id),
    FOREIGN KEY (id_nguoi_tao) REFERENCES tai_khoan(id),
    FOREIGN KEY (id_nguoi_duyet) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_tiet_dieu_chuyen (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_phieu_dieu_chuyen BIGINT UNSIGNED NOT NULL,
    id_san_pham BIGINT UNSIGNED NOT NULL,
    so_luong_yeu_cau INT NOT NULL,
    so_luong_xuat INT,
    so_luong_nhan INT,
    FOREIGN KEY (id_phieu_dieu_chuyen) REFERENCES phieu_dieu_chuyen(id),
    FOREIGN KEY (id_san_pham) REFERENCES san_pham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE van_chuyen (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_phieu_dieu_chuyen BIGINT UNSIGNED NOT NULL UNIQUE,
    phuong_thuc_van_chuyen VARCHAR(30) NOT NULL,
    id_nhan_vien_van_chuyen BIGINT UNSIGNED,
    ten_don_vi_van_chuyen VARCHAR(255),
    ma_van_don VARCHAR(100),
    thoi_gian_bat_dau DATETIME,
    thoi_gian_giao DATETIME,
    id_chi_nhanh_chiu_phi BIGINT UNSIGNED,
    trang_thai_thanh_toan_phi VARCHAR(20),
    FOREIGN KEY (id_phieu_dieu_chuyen) REFERENCES phieu_dieu_chuyen(id),
    FOREIGN KEY (id_nhan_vien_van_chuyen) REFERENCES tai_khoan(id),
    FOREIGN KEY (id_chi_nhanh_chiu_phi) REFERENCES chi_nhanh(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_phi_van_chuyen (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_van_chuyen BIGINT UNSIGNED NOT NULL,
    loai_chi_phi VARCHAR(50) NOT NULL,
    so_tien_du_kien DECIMAL(18,2),
    so_tien_thuc_te DECIMAL(18,2),
    ghi_chu VARCHAR(255),
    id_nguoi_ghi_nhan BIGINT UNSIGNED,
    thoi_gian_tao DATETIME NOT NULL,
    FOREIGN KEY (id_van_chuyen) REFERENCES van_chuyen(id),
    FOREIGN KEY (id_nguoi_ghi_nhan) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE thong_bao (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_tai_khoan_nhan BIGINT UNSIGNED NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT NOT NULL,
    loai_thong_bao VARCHAR(50) NOT NULL,
    doi_tuong_lien_quan VARCHAR(50),
    id_doi_tuong_lien_quan BIGINT UNSIGNED,
    thoi_gian_tao DATETIME NOT NULL,
    thoi_gian_da_doc DATETIME,
    FOREIGN KEY (id_tai_khoan_nhan) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lich_su_thao_tac (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_tai_khoan BIGINT UNSIGNED NOT NULL,
    loai_thao_tac VARCHAR(50) NOT NULL,
    doi_tuong_tac_dong VARCHAR(50) NOT NULL,
    id_doi_tuong BIGINT UNSIGNED,
    noi_dung_thay_doi TEXT,
    thoi_gian_tao DATETIME NOT NULL,
    FOREIGN KEY (id_tai_khoan) REFERENCES tai_khoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Dữ liệu mẫu
 -- 01. Vai trò và chi nhánh

INSERT INTO vai_tro (ma_vai_tro, ten_vai_tro, trang_thai)
VALUES
    ('ADMIN',   'Admin chuỗi',      'DANG_DUNG'),
    ('MANAGER', 'Cửa hàng trưởng',  'DANG_DUNG'),
    ('CASHIER', 'Thu ngân',         'DANG_DUNG');

SET @role_admin = (SELECT id FROM vai_tro WHERE ma_vai_tro = 'ADMIN');
SET @role_ql    = (SELECT id FROM vai_tro WHERE ma_vai_tro = 'MANAGER');
SET @role_tn    = (SELECT id FROM vai_tro WHERE ma_vai_tro = 'CASHIER');

INSERT INTO chi_nhanh
    (ma_chi_nhanh, ten_chi_nhanh, dia_chi, so_dien_thoai, trang_thai)
VALUES
    ('DEMO-a', 'Chi nhánh A', '12 Nguyễn Trãi', '02800000001', 'HOAT_DONG'),
    ('DEMO-b', 'Chi nhánh B', '35 Lê Lợi',     '02800000002', 'HOAT_DONG');

SET @cn_a = (SELECT id FROM chi_nhanh WHERE ma_chi_nhanh = 'DEMO-a');
SET @cn_b = (SELECT id FROM chi_nhanh WHERE ma_chi_nhanh = 'DEMO-b');


-- 02. Tài khoản demo. Mật khẩu các tài khoản hoạt động: PosDemo1411!

SET @mat_khau_demo = '$2b$10$K1oRkxUpjwHshENbAap57u7L5FEcCVDghvsXI9uy/wkj1GIwjFzwq';

INSERT INTO tai_khoan
    (id_vai_tro, id_chi_nhanh, ho_ten, ten_dang_nhap, mat_khau, trang_thai)
VALUES
    (@role_admin, NULL,  'Quản trị mẫu',     'demo_admin', @mat_khau_demo, 'HOAT_DONG'),
    (@role_ql,    @cn_a, 'Quản lý A',        'demo_ql_a',  @mat_khau_demo, 'HOAT_DONG'),
    (@role_ql,    @cn_b, 'Quản lý B',        'demo_ql_b',  @mat_khau_demo, 'HOAT_DONG'),
    (@role_tn,    @cn_a, 'Thu ngân A',       'demo_tn',    @mat_khau_demo, 'HOAT_DONG'),
    (@role_tn,    @cn_b, 'Thu ngân B',       'demo_tn_b',  @mat_khau_demo, 'HOAT_DONG'),
    (@role_tn,    @cn_a, 'Thu ngân đã khóa', 'demo_khoa',  @mat_khau_demo, 'BI_KHOA');

SET @admin = (SELECT id FROM tai_khoan WHERE ten_dang_nhap = 'demo_admin');
SET @ql_a  = (SELECT id FROM tai_khoan WHERE ten_dang_nhap = 'demo_ql_a');
SET @ql_b  = (SELECT id FROM tai_khoan WHERE ten_dang_nhap = 'demo_ql_b');
SET @tn_a  = (SELECT id FROM tai_khoan WHERE ten_dang_nhap = 'demo_tn');
SET @tn_b  = (SELECT id FROM tai_khoan WHERE ten_dang_nhap = 'demo_tn_b');


-- 03. Danh mục và sản phẩm

INSERT INTO danh_muc_san_pham
    (ma_danh_muc, ten_danh_muc, mo_ta, trang_thai)
VALUES
    ('DM001', 'Đồ uống',    'Nước uống đóng chai và đóng lon', 'DANG_DUNG'),
    ('DM002', 'Bánh kẹo',   'Bánh và đồ ăn nhẹ',              'DANG_DUNG'),
    ('DM003', 'Mì ăn liền', 'Mì gói và mì ly',                 'DANG_DUNG');

SET @dm_nuoc = (SELECT id FROM danh_muc_san_pham WHERE ma_danh_muc = 'DM001');
SET @dm_banh = (SELECT id FROM danh_muc_san_pham WHERE ma_danh_muc = 'DM002');
SET @dm_mi   = (SELECT id FROM danh_muc_san_pham WHERE ma_danh_muc = 'DM003');

INSERT INTO san_pham
    (id_danh_muc, ma_san_pham, ma_vach, ten_san_pham, don_vi_tinh, gia_ban, trang_thai)
VALUES
    (@dm_nuoc, 'DEMO-NUOC', '2990000000019', 'Nước suối 500 ml',    'Chai', 10000, 'DANG_DUNG'),
    (@dm_nuoc, 'DEMO-TRA',  '2990000000026', 'Trà đào 350 ml',      'Chai', 15000, 'DANG_DUNG'),
    (@dm_banh, 'DEMO-BANH', '2990000000033', 'Bánh quy bơ 80 g',    'Gói',  12000, 'DANG_DUNG'),
    (@dm_banh, 'DEMO-KEO',  NULL,            'Kẹo bạc hà 30 g',     'Gói',   5000, 'NGUNG_DUNG'),
    (@dm_mi,   'DEMO-MI',   '8934563138165', 'Mì tôm chua cay',     'Gói',   8000, 'DANG_DUNG'),
    (@dm_mi,   'DEMO-MILY', '2990000000064', 'Mì ly vị bò',         'Ly',   14000, 'DANG_DUNG');

SET @nuoc = (SELECT id FROM san_pham WHERE ma_san_pham = 'DEMO-NUOC');
SET @tra  = (SELECT id FROM san_pham WHERE ma_san_pham = 'DEMO-TRA');
SET @banh = (SELECT id FROM san_pham WHERE ma_san_pham = 'DEMO-BANH');
SET @mi   = (SELECT id FROM san_pham WHERE ma_san_pham = 'DEMO-MI');
SET @mily = (SELECT id FROM san_pham WHERE ma_san_pham = 'DEMO-MILY');


-- 04. Khách hàng và chính sách tích điểm

INSERT INTO khach_hang
    (ho_ten, so_dien_thoai, diem_hien_co, ngay_dang_ky, trang_thai)
VALUES
    ('Khách hàng mẫu', '0000000001', 27, '2026-11-14 06:30:00', 'HOAT_DONG'),
    ('Trần Minh Anh',  '0000000002', 36, '2026-11-14 07:15:00', 'HOAT_DONG'),
    ('Lê Hoàng Nam',   '0000000003',  0, '2026-11-14 09:00:00', 'HOAT_DONG');

SET @kh_1 = (SELECT id FROM khach_hang WHERE so_dien_thoai = '0000000001');
SET @kh_2 = (SELECT id FROM khach_hang WHERE so_dien_thoai = '0000000002');

INSERT INTO chinh_sach_tich_diem
    (so_tien_quy_doi, so_diem_nhan, thoi_gian_bat_dau, trang_thai)
VALUES
    (1000, 1, '2026-11-14 00:00:00', 'HIEU_LUC');

SET @cs_diem = LAST_INSERT_ID();


-- 05. Khuyến mãi theo chi nhánh

INSERT INTO chuong_trinh_khuyen_mai
    (ten_chuong_trinh, loai_giam_gia, gia_tri_giam, hoa_don_toi_thieu,
     thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
VALUES
    ('Ưu đãi mẫu 10% tại A', 'PHAN_TRAM', 10, 30000,
     '2026-11-14 00:00:00', '2026-11-14 23:59:59', 'DA_CONG_BO');

SET @km_a = LAST_INSERT_ID();

INSERT INTO chuong_trinh_khuyen_mai
    (ten_chuong_trinh, loai_giam_gia, gia_tri_giam, hoa_don_toi_thieu,
     thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
VALUES
    ('Giảm 10% cho hóa đơn từ 40.000 đồng tại B', 'PHAN_TRAM', 10, 40000,
     '2026-11-14 08:00:00', '2026-11-14 18:00:00', 'DA_CONG_BO');

SET @km_b = LAST_INSERT_ID();

INSERT INTO ap_dung_khuyen_mai_chi_nhanh
    (id_chuong_trinh_khuyen_mai, id_chi_nhanh)
VALUES
    (@km_a, @cn_a),
    (@km_b, @cn_b);


-- 06. Ca làm việc, phân công và phiên thu ngân

INSERT INTO ca_lam_viec
    (id_chi_nhanh, ngay_lam_viec, loai_ca, gio_bat_dau, gio_ket_thuc, trang_thai)
VALUES
    (@cn_a, '2026-11-14', 'SANG',  '2026-11-14 06:00:00', '2026-11-14 14:00:00', 'KET_THUC'),
    (@cn_a, '2026-11-14', 'CHIEU', '2026-11-14 14:00:00', '2026-11-14 18:00:00', 'DU_KIEN'),
    (@cn_a, '2026-11-14', 'TOI',   '2026-11-14 18:00:00', '2026-11-14 22:00:00', 'DU_KIEN'),
    (@cn_b, '2026-11-14', 'SANG',  '2026-11-14 06:00:00', '2026-11-14 14:00:00', 'KET_THUC');

SET @ca_a_sang = (
    SELECT id FROM ca_lam_viec
    WHERE id_chi_nhanh = @cn_a AND ngay_lam_viec = '2026-11-14' AND loai_ca = 'SANG'
);
SET @ca_a_chieu = (
    SELECT id FROM ca_lam_viec
    WHERE id_chi_nhanh = @cn_a AND ngay_lam_viec = '2026-11-14' AND loai_ca = 'CHIEU'
);
SET @ca_b_sang = (
    SELECT id FROM ca_lam_viec
    WHERE id_chi_nhanh = @cn_b AND ngay_lam_viec = '2026-11-14' AND loai_ca = 'SANG'
);

INSERT INTO phan_cong_ca (id_ca_lam_viec, id_tai_khoan, nhiem_vu)
VALUES
    (@ca_a_sang,  @tn_a, 'THU_NGAN'),
    (@ca_b_sang,  @tn_b, 'THU_NGAN'),
    (@ca_a_chieu, @tn_a, 'THU_NGAN');

SET @pc_a = (
    SELECT id FROM phan_cong_ca
    WHERE id_ca_lam_viec = @ca_a_sang AND id_tai_khoan = @tn_a
);
SET @pc_b = (
    SELECT id FROM phan_cong_ca
    WHERE id_ca_lam_viec = @ca_b_sang AND id_tai_khoan = @tn_b
);

INSERT INTO phien_thu_ngan
    (id_phan_cong_ca, thoi_gian_mo, thoi_gian_dong, tien_dau_ca,
     tien_du_kien_cuoi_ca, tien_thuc_te, tien_chenh_lech, trang_thai,
     id_nguoi_doi_soat, thoi_gian_doi_soat)
VALUES
    (@pc_a, '2026-11-14 06:00:00', '2026-11-14 14:00:00',
     200000, 227000, 227000, 0, 'DA_DOI_SOAT', @ql_a, '2026-11-14 14:05:00');

SET @phien_a = LAST_INSERT_ID();

INSERT INTO phien_thu_ngan
    (id_phan_cong_ca, thoi_gian_mo, thoi_gian_dong, tien_dau_ca,
     tien_du_kien_cuoi_ca, tien_thuc_te, tien_chenh_lech, trang_thai,
     id_nguoi_doi_soat, thoi_gian_doi_soat)
VALUES
    (@pc_b, '2026-11-14 06:00:00', '2026-11-14 14:00:00',
     150000, 158000, 157000, -1000, 'DA_DOI_SOAT', @ql_b, '2026-11-14 14:08:00');

SET @phien_b = LAST_INSERT_ID();


-- 07. Ba hóa đơn: tiền mặt có ưu đãi, QR có ưu đãi, khách lẻ tiền mặt

INSERT INTO hoa_don
    (so_hoa_don, id_phien_thu_ngan, id_khach_hang, id_chuong_trinh_khuyen_mai,
     tong_tien_hang, tong_giam_gia, tien_phai_thanh_toan, trang_thai,
     ma_yeu_cau, thoi_gian_tao, thoi_gian_hoan_tat)
VALUES
    ('DEMO-HD001', @phien_a, @kh_1, @km_a, 30000, 3000, 27000, 'DA_THANH_TOAN',
     'DEMO-REQ001', '2026-11-14 08:00:00', '2026-11-14 08:01:00'),
    ('DEMO-HD002', @phien_b, @kh_2, @km_b, 40000, 4000, 36000, 'DA_THANH_TOAN',
     'DEMO-REQ002', '2026-11-14 11:30:00', '2026-11-14 11:32:00'),
    ('DEMO-HD003', @phien_b, NULL, NULL, 8000, 0, 8000, 'DA_THANH_TOAN',
     'DEMO-REQ003', '2026-11-14 12:00:00', '2026-11-14 12:01:00');

SET @hd_1 = (SELECT id FROM hoa_don WHERE so_hoa_don = 'DEMO-HD001');
SET @hd_2 = (SELECT id FROM hoa_don WHERE so_hoa_don = 'DEMO-HD002');
SET @hd_3 = (SELECT id FROM hoa_don WHERE so_hoa_don = 'DEMO-HD003');

INSERT INTO chi_tiet_hoa_don
    (id_hoa_don, id_san_pham, so_luong, don_gia, thanh_tien)
VALUES
    (@hd_1, @nuoc, 3, 10000, 30000),
    (@hd_2, @banh, 2, 12000, 24000),
    (@hd_2, @mi,   2,  8000, 16000),
    (@hd_3, @mi,   1,  8000,  8000);

INSERT INTO thanh_toan
    (id_hoa_don, phuong_thuc, so_tien_thanh_toan, so_tien_khach_dua,
     so_tien_tra_lai, trang_thai, id_nguoi_xac_nhan, thoi_gian_xac_nhan)
VALUES
    (@hd_1, 'TIEN_MAT', 27000, 50000, 23000, 'DA_XAC_NHAN', @tn_a, '2026-11-14 08:01:00'),
    (@hd_2, 'QR',       36000, 36000,     0, 'DA_XAC_NHAN', @tn_b, '2026-11-14 11:32:00'),
    (@hd_3, 'TIEN_MAT',  8000, 10000,  2000, 'DA_XAC_NHAN', @tn_b, '2026-11-14 12:01:00');

INSERT INTO lich_su_tich_diem
    (id_khach_hang, id_hoa_don, id_chinh_sach_tich_diem, so_diem_cong, thoi_gian_tao)
VALUES
    (@kh_1, @hd_1, @cs_diem, 27, '2026-11-14 08:01:00'),
    (@kh_2, @hd_2, @cs_diem, 36, '2026-11-14 11:32:00');


-- 08. Điều chuyển: hai phiếu đã nhận, một phiếu chờ duyệt

INSERT INTO phieu_dieu_chuyen
    (ma_phieu, id_chi_nhanh_xuat, id_chi_nhanh_nhan, id_nguoi_tao,
     id_nguoi_duyet, trang_thai, thoi_gian_tao, thoi_gian_duyet,
     thoi_gian_xuat, thoi_gian_nhan)
VALUES
    ('DEMO-DC001', @cn_a, @cn_b, @ql_a, @ql_b, 'DA_NHAN',
     '2026-11-14 09:00:00', '2026-11-14 09:10:00',
     '2026-11-14 10:00:00', '2026-11-14 11:00:00'),
    ('DEMO-DC002', @cn_a, @cn_b, @ql_a, @ql_b, 'DA_NHAN',
     '2026-11-14 09:15:00', '2026-11-14 09:25:00',
     '2026-11-14 10:10:00', '2026-11-14 11:10:00'),
    ('DEMO-DC003', @cn_b, @cn_a, @ql_b, NULL, 'CHO_DUYET',
     '2026-11-14 13:00:00', NULL, NULL, NULL);

SET @dc_1 = (SELECT id FROM phieu_dieu_chuyen WHERE ma_phieu = 'DEMO-DC001');
SET @dc_2 = (SELECT id FROM phieu_dieu_chuyen WHERE ma_phieu = 'DEMO-DC002');
SET @dc_3 = (SELECT id FROM phieu_dieu_chuyen WHERE ma_phieu = 'DEMO-DC003');

INSERT INTO chi_tiet_dieu_chuyen
    (id_phieu_dieu_chuyen, id_san_pham, so_luong_yeu_cau, so_luong_xuat, so_luong_nhan)
VALUES
    (@dc_1, @nuoc, 5, 5, 5),
    (@dc_2, @banh, 4, 4, 4),
    (@dc_3, @mi,   2, 0, 0);

INSERT INTO van_chuyen
    (id_phieu_dieu_chuyen, phuong_thuc_van_chuyen, ten_don_vi_van_chuyen,
     ma_van_don, thoi_gian_bat_dau, thoi_gian_giao, id_chi_nhanh_chiu_phi,
     trang_thai_thanh_toan_phi)
VALUES
    (@dc_1, 'THUE_NGOAI', 'Vận chuyển mẫu', 'DEMO-VD001',
     '2026-11-14 10:00:00', '2026-11-14 11:00:00', @cn_a, 'DA_THANH_TOAN'),
    (@dc_2, 'THUE_NGOAI', 'Giao hàng mẫu',  'DEMO-VD002',
     '2026-11-14 10:10:00', '2026-11-14 11:10:00', @cn_b, 'DA_THANH_TOAN');

SET @vc_1 = (SELECT id FROM van_chuyen WHERE ma_van_don = 'DEMO-VD001');
SET @vc_2 = (SELECT id FROM van_chuyen WHERE ma_van_don = 'DEMO-VD002');

INSERT INTO chi_phi_van_chuyen
    (id_van_chuyen, loai_chi_phi, so_tien_du_kien, so_tien_thuc_te,
     id_nguoi_ghi_nhan, thoi_gian_tao)
VALUES
    (@vc_1, 'CUOC_GIAO_HANG', 15000, 15000, @ql_a, '2026-11-14 11:05:00'),
    (@vc_2, 'CUOC_GIAO_HANG', 12000, 14000, @ql_b, '2026-11-14 11:15:00');


-- 09. Tồn kho cuối kỳ và lịch sử biến động ngày 14/11

INSERT INTO ton_kho
    (id_chi_nhanh, id_san_pham, so_luong_hien_co, nguong_canh_bao, thoi_gian_cap_nhat)
VALUES
    (@cn_a, @nuoc, 12, 3, '2026-11-14 10:00:00'),
    (@cn_b, @nuoc,  5, 3, '2026-11-14 11:00:00'),
    (@cn_a, @banh,  6, 3, '2026-11-14 10:10:00'),
    (@cn_b, @banh,  4, 3, '2026-11-14 11:32:00'),
    (@cn_b, @mi,    3, 4, '2026-11-14 12:01:00'),
    (@cn_a, @tra,   8, 2, '2026-11-14 06:00:00'),
    (@cn_a, @mily,  0, 2, '2026-11-14 06:00:00');

SET @k_a_nuoc = (SELECT id FROM ton_kho WHERE id_chi_nhanh = @cn_a AND id_san_pham = @nuoc);
SET @k_b_nuoc = (SELECT id FROM ton_kho WHERE id_chi_nhanh = @cn_b AND id_san_pham = @nuoc);
SET @k_a_banh = (SELECT id FROM ton_kho WHERE id_chi_nhanh = @cn_a AND id_san_pham = @banh);
SET @k_b_banh = (SELECT id FROM ton_kho WHERE id_chi_nhanh = @cn_b AND id_san_pham = @banh);
SET @k_b_mi   = (SELECT id FROM ton_kho WHERE id_chi_nhanh = @cn_b AND id_san_pham = @mi);
SET @k_a_tra  = (SELECT id FROM ton_kho WHERE id_chi_nhanh = @cn_a AND id_san_pham = @tra);

INSERT INTO bien_dong_kho
    (id_ton_kho, loai_bien_dong, so_luong_thay_doi, ma_chung_tu,
     id_nguoi_thuc_hien, thoi_gian_tao)
VALUES
    (@k_a_nuoc, 'NHAP_KHO',         20, 'DEMO-NK001', @ql_a, '2026-11-14 06:00:00'),
    (@k_a_banh, 'NHAP_KHO',         10, 'DEMO-NK002', @ql_a, '2026-11-14 06:00:00'),
    (@k_b_banh, 'NHAP_KHO',          2, 'DEMO-NK003', @ql_b, '2026-11-14 06:00:00'),
    (@k_b_mi,   'NHAP_KHO',          6, 'DEMO-NK004', @ql_b, '2026-11-14 06:00:00'),
    (@k_a_tra,  'NHAP_KHO',          8, 'DEMO-NK005', @ql_a, '2026-11-14 06:00:00'),
    (@k_a_nuoc, 'BAN_HANG',         -3, 'DEMO-HD001', @tn_a, '2026-11-14 08:01:00'),
    (@k_a_nuoc, 'XUAT_DIEU_CHUYEN', -5, 'DEMO-DC001', @ql_a, '2026-11-14 10:00:00'),
    (@k_a_banh, 'XUAT_DIEU_CHUYEN', -4, 'DEMO-DC002', @ql_a, '2026-11-14 10:10:00'),
    (@k_b_nuoc, 'NHAN_DIEU_CHUYEN',  5, 'DEMO-DC001', @ql_b, '2026-11-14 11:00:00'),
    (@k_b_banh, 'NHAN_DIEU_CHUYEN',  4, 'DEMO-DC002', @ql_b, '2026-11-14 11:10:00'),
    (@k_b_banh, 'BAN_HANG',         -2, 'DEMO-HD002', @tn_b, '2026-11-14 11:32:00'),
    (@k_b_mi,   'BAN_HANG',         -2, 'DEMO-HD002', @tn_b, '2026-11-14 11:32:00'),
    (@k_b_mi,   'BAN_HANG',         -1, 'DEMO-HD003', @tn_b, '2026-11-14 12:01:00');


-- 10. Thông báo và lịch sử thao tác

INSERT INTO thong_bao
    (id_tai_khoan_nhan, tieu_de, noi_dung, loai_thong_bao,
     doi_tuong_lien_quan, id_doi_tuong_lien_quan, thoi_gian_tao)
VALUES
    (@tn_a, 'Ưu đãi tại chi nhánh A', 'Giảm 10% cho hóa đơn từ 30.000 đồng.',
     'KHUYEN_MAI', 'chuong_trinh_khuyen_mai', @km_a, '2026-11-14 06:00:00'),
    (@tn_b, 'Ưu đãi tại chi nhánh B', 'Giảm 10% cho hóa đơn từ 40.000 đồng.',
     'KHUYEN_MAI', 'chuong_trinh_khuyen_mai', @km_b, '2026-11-14 08:00:00'),
    (@admin, 'Chi nhánh B đã nhận hàng', 'Đã nhận đủ 5 chai nước theo phiếu DEMO-DC001.',
     'DIEU_CHUYEN', 'phieu_dieu_chuyen', @dc_1, '2026-11-14 11:00:00'),
    (@admin, 'Có yêu cầu điều chuyển mới', 'Chi nhánh B đề nghị chuyển 2 gói mì sang A.',
     'DIEU_CHUYEN', 'phieu_dieu_chuyen', @dc_3, '2026-11-14 13:00:00'),
    (@ql_a, 'Phiếu DEMO-DC003 chờ duyệt', 'Vui lòng kiểm tra yêu cầu nhận 2 gói mì.',
     'DIEU_CHUYEN', 'phieu_dieu_chuyen', @dc_3, '2026-11-14 13:00:00');

INSERT INTO lich_su_thao_tac
    (id_tai_khoan, loai_thao_tac, doi_tuong_tac_dong,
     id_doi_tuong, noi_dung_thay_doi, thoi_gian_tao)
VALUES
    (@ql_b, 'XAC_NHAN_NHAN', 'phieu_dieu_chuyen', @dc_1,
     'Đã nhận đủ 5 chai nước.', '2026-11-14 11:00:00'),
    (@ql_b, 'XAC_NHAN_NHAN', 'phieu_dieu_chuyen', @dc_2,
     'Đã nhận đủ 4 gói bánh quy.', '2026-11-14 11:10:00'),
    (@tn_b, 'XAC_NHAN_QR', 'hoa_don', @hd_2,
     'Thu ngân đã xác nhận nhận 36.000 đồng qua QR.', '2026-11-14 11:32:00');