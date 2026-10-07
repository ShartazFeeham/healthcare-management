package com.healthcare.account.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

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
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,AuthenticationManager authenticationManager)
            throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth->{
                    auth
                            // Order matters: the specific internal-only rule must come before the broad permitAll.
                            .requestMatchers(HttpMethod.GET, "/access/getEmail/{userId}").hasRole("INTERNAL")
                            .requestMatchers(HttpMethod.POST, "/access/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/access/**").permitAll()

                            .requestMatchers(HttpMethod.GET, "/account/**").authenticated()
                            .requestMatchers(HttpMethod.POST, "/account/create-account").hasRole("INTERNAL")
                            .requestMatchers(HttpMethod.POST, "/account/create-admin-account").hasAnyRole("INTERNAL", "ADMIN")

                            .requestMatchers(HttpMethod.PUT, "/status/toggle-two-factor/{status}").authenticated()
                            .requestMatchers(HttpMethod.PUT, "/status/toggle-deactivation/{userId}/{status}").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/status/toggle-lockout/{userId}/{status}").hasAnyRole("INTERNAL", "ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/status/toggle-enabling/{userId}/{status}").hasAnyRole("INTERNAL", "ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/status/toggle-suspension/**").hasAnyRole("INTERNAL", "ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/status/add-ban-hour/**").hasAnyRole("INTERNAL", "ADMIN")

                            .requestMatchers(HttpMethod.PUT, "/recovery/change-password").authenticated()
                            .requestMatchers(HttpMethod.PUT, "/recovery/reset-password").permitAll()
                            .anyRequest().authenticated();
                })
                .addFilterBefore(new CustomAuthorizationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
