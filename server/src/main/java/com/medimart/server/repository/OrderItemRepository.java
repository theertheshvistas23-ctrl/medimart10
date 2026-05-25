package com.medimart.server.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.medimart.server.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

}
