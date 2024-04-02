import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaPendientesComponent } from './tabla-pendientes.component';

describe('TablaPendientesComponent', () => {
  let component: TablaPendientesComponent;
  let fixture: ComponentFixture<TablaPendientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TablaPendientesComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TablaPendientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
