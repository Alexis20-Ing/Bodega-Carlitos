import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuevaRecepcionPage } from './nueva-recepcion.page';

describe('NuevaRecepcionPage', () => {
  let component: NuevaRecepcionPage;
  let fixture: ComponentFixture<NuevaRecepcionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NuevaRecepcionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
