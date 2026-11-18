
package com.pos.backend.xacthuc;

import java.util.List;

import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class BaoMatConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(JdbcTemplate jdbc) {
        return tenDangNhap -> {
            String sql = """
                    SELECT tk.ten_dang_nhap, tk.mat_khau, tk.trang_thai,
                           vt.ma_vai_tro, vt.trang_thai AS trang_thai_vai_tro
                    FROM tai_khoan tk
                    JOIN vai_tro vt ON vt.id = tk.id_vai_tro
                    WHERE tk.ten_dang_nhap = ?
                    """;

            List<UserDetails> ketQua = jdbc.query(sql, (rs, rowNum) ->
                    User.withUsername(rs.getString("ten_dang_nhap"))
                            .password(rs.getString("mat_khau"))
                            .roles(rs.getString("ma_vai_tro"))
                            .disabled(
                                    !"HOAT_DONG".equals(rs.getString("trang_thai"))
                                    || !"DANG_DUNG".equals(rs.getString("trang_thai_vai_tro"))
                            )
                            .build(),
                    tenDangNhap
            );

            return ketQua.stream().findFirst().orElseThrow(() ->
                    new UsernameNotFoundException("Không tìm thấy tài khoản.")
            );
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()

                .requestMatchers(HttpMethod.GET, "/api/xac-thuc/csrf").permitAll()
                .requestMatchers("/api/xac-thuc/toi").authenticated()

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/san-pham", "/api/san-pham/**",
                        "/api/danh-muc", "/api/danh-muc/**"
                ).hasAnyRole("ADMIN", "MANAGER", "CASHIER")

                .requestMatchers(
                        "/api/san-pham", "/api/san-pham/**",
                        "/api/danh-muc", "/api/danh-muc/**",
                        "/api/tai-khoan", "/api/tai-khoan/**",
                        "/api/chi-nhanh", "/api/chi-nhanh/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/ban-hang/khach-hang"
                ).hasRole("CASHIER")

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/ban-hang/tien-mat",
                        "/api/ban-hang/qr"
                ).hasRole("CASHIER")

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/thu-ngan/phan-cong-cua-toi",
                        "/api/thu-ngan/phien/hien-tai"
                ).hasRole("CASHIER")

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/thu-ngan/phien/mo",
                        "/api/thu-ngan/phien/dong"
                ).hasRole("CASHIER")

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/thu-ngan/doi-soat",
                        "/api/thu-ngan/doi-soat/**"
                ).hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/thu-ngan/doi-soat/**"
                ).hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/quan-ly-ca",
                        "/api/quan-ly-ca/nhan-vien"
                ).hasRole("MANAGER")

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/quan-ly-ca/phan-cong"
                ).hasRole("MANAGER")

                .requestMatchers("/api/**").denyAll()
                .anyRequest().permitAll()
            )
            .requestCache(cache -> cache.disable())
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, exception) ->
                    response.setStatus(401)
                )
                .accessDeniedHandler((request, response, exception) ->
                    response.setStatus(403)
                )
            )
            .formLogin(login -> login
                .loginProcessingUrl("/api/xac-thuc/dang-nhap")
                .usernameParameter("tenDangNhap")
                .passwordParameter("matKhau")
                .successHandler((request, response, authentication) ->
                    response.setStatus(204)
                )
                .failureHandler((request, response, exception) ->
                    response.setStatus(401)
                )
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/api/xac-thuc/dang-xuat")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((request, response, authentication) ->
                    response.setStatus(204)
                )
                .permitAll()
            );

        return http.build();
    }
}
