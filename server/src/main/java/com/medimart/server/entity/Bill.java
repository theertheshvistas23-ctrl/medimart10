package com.medimart.server.entity;

import java.util.Date;

import jakarta.persistence.*;

@Entity
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Date billDate;

    private Double totalAmount;

    @ManyToOne
    private User cashier;

    @OneToOne
    private Order order;

    // Constructors
    // Getters and Setters
}