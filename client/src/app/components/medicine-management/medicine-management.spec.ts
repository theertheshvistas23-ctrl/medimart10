import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicineManagementComponent } from './medicine-management';

describe('MedicineManagementComponent', () => {
  let component: MedicineManagementComponent;
  let fixture: ComponentFixture<MedicineManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicineManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicineManagementComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
