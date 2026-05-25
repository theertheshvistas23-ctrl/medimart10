package com.medimart.server.repository;


import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.medimart.server.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o WHERE o.user.id = :customerId")
    List<Order> findOrdersByCustomerId(Long customerId);

    @Query("SELECT o FROM Order o WHERE DATE(o.orderDate) = DATE(:date)")
    List<Order> salesReport(Date date);
}
