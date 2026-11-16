package com.pos.backend.danhmuc;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/danh-muc")
public class DanhMucSanPhamController {

    private final DanhMucSanPhamRepository repository;

    public DanhMucSanPhamController(DanhMucSanPhamRepository repository) {
        this.repository = repository;
    }

    public record TaoDanhMucRequest(
        String maDanhMuc,
        String tenDanhMuc,
        String moTa
    ) {
    }

    @GetMapping
    public List<DanhMucSanPham> layDanhSach() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DanhMucSanPham taoDanhMuc(@RequestBody TaoDanhMucRequest request) {
        String ma = request.maDanhMuc() == null
                ? "" : request.maDanhMuc().strip();
        String ten = request.tenDanhMuc() == null
                ? "" : request.tenDanhMuc().strip();

        if (ma.isEmpty() || ten.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập mã và tên danh mục."
            );
        }

        if (ma.length() > 50 || ten.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã tối đa 50 ký tự và tên tối đa 255 ký tự."
            );
        }

        if (repository.existsByMaDanhMuc(ma)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã danh mục đã tồn tại."
            );
        }

        String moTa = request.moTa() == null ? null : request.moTa().strip();
        DanhMucSanPham danhMuc = new DanhMucSanPham(ma, ten, moTa);

        return repository.save(danhMuc);
    }
}