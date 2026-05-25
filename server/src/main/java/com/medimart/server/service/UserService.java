package com.medimart.server.service;

import com.medimart.server.entity.User;

import java.util.List;

public interface UserService {

    List<User> getAllUsers();
}