package com.nihongo.learning.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class CorsConfiguration implements WebMvcConfigurer {
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins("http://localhost:4200").allowedMethods("GET", "POST");
    }
}
