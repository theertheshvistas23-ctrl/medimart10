package com.medimart.server.controller;

import com.medimart.server.entity.Role;
import com.medimart.server.entity.User;
import com.medimart.server.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin("*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/cashiers/pending")
    public ResponseEntity<?> getPendingCashiers() {

        return ResponseEntity.ok(
                userRepository.findByRoleAndApproved(
                        Role.CASHIER,
                        false
                )
        );
    }


    @PutMapping("/cashiers/approve/{id}")
    public ResponseEntity<?> approveCashier(
            @PathVariable Long id
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cashier not found"
                        ));

        user.setApproved(true);

        userRepository.save(user);

        return ResponseEntity.ok(
                "Cashier approved successfully"
        );
    }

    @DeleteMapping("/cashiers/reject/{id}")
    public ResponseEntity<?> rejectCashier(
            @PathVariable Long id
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cashier not found"
                        ));

        userRepository.delete(user);

        return ResponseEntity.ok(
                "Cashier rejected successfully"
        );
    }
}