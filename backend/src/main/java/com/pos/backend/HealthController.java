package com.pos.backend;

import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController 
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health(){
        return Map.of( 
            "status", "success",
            "message", "Backend POS dang hoat dong"
        );

    }
}
    
    

