package com.medimart.server.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;

@Entity
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer quantity;

    private Double price;

    @ManyToOne
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @ManyToOne
    @JoinColumn(name = "order_id")
    @JsonBackReference
    private Order order;

    public OrderItem() {
    }

    public OrderItem(Long id, Integer quantity,
                     Double price, Medicine medicine,
                     Order order) {

        this.id = id;
        this.quantity = quantity;
        this.price = price;
        this.medicine = medicine;
        this.order = order;
    }

    // Getters and Setters
}