import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaSeguimientoComponent } from './tabla-seguimiento.component';

describe('TablaSeguimientoComponent', () => {
  let component: TablaSeguimientoComponent;
  let fixture: ComponentFixture<TablaSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TablaSeguimientoComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TablaSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
