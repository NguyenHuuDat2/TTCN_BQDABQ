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
