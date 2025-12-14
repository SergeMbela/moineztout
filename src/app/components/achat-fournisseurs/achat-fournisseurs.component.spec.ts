import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchatFournisseursComponent } from './achat-fournisseurs.component';

describe('AchatFournisseursComponent', () => {
  let component: AchatFournisseursComponent;
  let fixture: ComponentFixture<AchatFournisseursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchatFournisseursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AchatFournisseursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
