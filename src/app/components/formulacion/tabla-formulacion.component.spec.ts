import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaFormulacionComponent } from './tabla-formulacion.component';

describe('TablaPendientesComponent', () => {
  let component: TablaFormulacionComponent;
  let fixture: ComponentFixture<TablaFormulacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TablaFormulacionComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TablaFormulacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
