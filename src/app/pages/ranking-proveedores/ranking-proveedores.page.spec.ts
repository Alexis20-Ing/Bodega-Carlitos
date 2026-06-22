import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RankingProveedoresPage } from './ranking-proveedores.page';

describe('RankingProveedoresPage', () => {
  let component: RankingProveedoresPage;
  let fixture: ComponentFixture<RankingProveedoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RankingProveedoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
