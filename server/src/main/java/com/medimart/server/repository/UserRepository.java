package com.medimart.server.repository;

import com.medimart.server.entity.Role;
import com.medimart.server.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByPhoneNumber(String phoneNumber);

    List<User> findByRoleAndApproved(
            Role role,
            Boolean approved
    );
}