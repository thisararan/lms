package com.lms.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtUtils jwtUtils;

    @Bean
    public JwtAuthenticationFilter authenticationJwtTokenFilter() {
        return new JwtAuthenticationFilter(jwtUtils, userDetailsService);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors().and()
                .csrf().disable()
                .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).and()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
                .authorizeHttpRequests() // updated
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/error").permitAll()

                // File downloads - authenticated only
                .requestMatchers("/api/files/download/**").authenticated()

                // Admin only endpoints
                .requestMatchers("/api/users/dashboard/**").hasRole("ADMIN")
                .requestMatchers("/api/users/statistics/**").hasRole("ADMIN")
                .requestMatchers("/api/users/admins/**").hasRole("ADMIN")
                .requestMatchers("/api/users/teachers").hasRole("ADMIN")
                .requestMatchers("/api/users/students").hasRole("ADMIN")
                .requestMatchers("/api/users").hasRole("ADMIN")
                .requestMatchers("/api/users/**").hasRole("ADMIN")

                // Admin-specific course endpoints
                .requestMatchers("/api/courses/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/courses/**").hasRole("ADMIN")

                // Teacher endpoints (teachers and admins can access)
                .requestMatchers("/api/teacher/**").hasAnyRole("TEACHER", "ADMIN")

                // Course management (teachers and admins can create/update/delete)
                .requestMatchers(HttpMethod.POST, "/api/courses").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/courses/*").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/courses/*").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()

                // Assignment management (teachers and admins can create/update/delete)
                .requestMatchers("/api/assignments").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers("/api/assignments/*").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers("/api/assignments/course/**").authenticated()

                // Submission management
                .requestMatchers(HttpMethod.POST, "/api/submissions/**").hasRole("STUDENT")
                .requestMatchers(HttpMethod.PUT, "/api/submissions/*/grade").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers("/api/submissions/assignment/**").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers("/api/submissions/my").hasRole("STUDENT")

                // Note management
                .requestMatchers("/api/notes/accessible").authenticated()
                .requestMatchers("/api/notes/**").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers("/api/notes/course/**").authenticated()

                // All other endpoints require authentication
                .anyRequest().authenticated();

        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        // For H2 console
        http.headers().frameOptions().sameOrigin();

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
