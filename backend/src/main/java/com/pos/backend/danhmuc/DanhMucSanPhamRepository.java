package com.pos.backend.danhmuc;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DanhMucSanPhamRepository
        extends JpaRepository<DanhMucSanPham, Long> {

        boolean existsByMaDanhMuc(String maDanhMuc);
}