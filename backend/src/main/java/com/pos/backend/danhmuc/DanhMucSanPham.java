package com.pos.backend.danhmuc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "danh_muc_san_pham")
public class DanhMucSanPham {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "ma_danh_muc", nullable = false, unique = true, length = 50)
    private String maDanhMuc;

    @Column(name = "ten_danh_muc", nullable = false, length = 255)
    private String tenDanhMuc;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai;

    public Long getId() {
        return id;
    }

    public String getMaDanhMuc() {
        return maDanhMuc;
    }

    public String getTenDanhMuc() {
        return tenDanhMuc;
    }

    public String getMoTa() {
        return moTa;
    }

    public String getTrangThai() {
        return trangThai;
    }
}