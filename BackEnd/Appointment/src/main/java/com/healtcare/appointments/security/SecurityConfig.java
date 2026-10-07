package com.healtcare.appointments.security;

import jakarta.ws.rs.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:3100");
        config.addAllowedHeader("*");
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthenticationManager authenticationManager) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth
                            // All get api are public
                            .requestMatchers(HttpMethod.GET, "/**").permitAll()

                            // Delay scheduling is only for doctors
                            .requestMatchers(HttpMethod.POST, "/delays/**").hasRole("DOCTOR")
                            .requestMatchers(HttpMethod.DELETE, "/delays/**").hasRole("DOCTOR")
                            .requestMatchers(HttpMethod.PUT, "/delays/**").hasRole("DOCTOR")

                            // Both patients and admin can create appointments
                            .requestMatchers(HttpMethod.POST, "/appointments/**").hasAnyRole("PATIENT", "ADMIN")
                            .requestMatchers(HttpMethod.DELETE, "/appointments/**").hasAnyRole("PATIENT", "ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/appointments/**").hasAnyRole("PATIENT", "ADMIN")

                            // Only admin can manipulate equipments
                            .requestMatchers(HttpMethod.POST, "/equipments/**").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.DELETE, "/equipments/**").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/equipments/**").hasRole("ADMIN")

                            // Reviews are only for patients
                            .requestMatchers(HttpMethod.POST, "/reviews/**").hasRole("PATIENT")
                            .requestMatchers(HttpMethod.DELETE, "/reviews/**").hasRole("PATIENT")
                            .requestMatchers(HttpMethod.PUT, "/reviews/**").hasRole("PATIENT")

                            // Appointment scheduling is only for doctors
                            .requestMatchers(HttpMethod.POST, "/schedule/**").hasRole("DOCTOR")
                            .requestMatchers(HttpMethod.DELETE, "/schedule/**").hasRole("DOCTOR")
                            .requestMatchers(HttpMethod.PUT, "/schedule/**").hasRole("DOCTOR")

                            // Telemedicine is for all authentic
                            .requestMatchers(HttpMethod.GET, "/tele/**").authenticated()
                            .anyRequest().authenticated();
                })
                .addFilterBefore(new CustomAuthorizationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}