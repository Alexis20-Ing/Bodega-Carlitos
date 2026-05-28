import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {

  usuario = '';
  password = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private firebaseService: FirebaseService
  ) {}

  async ingresar() {

    if (this.usuario.trim() === '' || this.password.trim() === '') {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Completa los campos',
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    const user = await this.firebaseService.login(
      this.usuario,
      this.password
    );

    if (!user) {

      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Usuario o contraseña incorrectos',
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    // 🔥 guardar sesión
    localStorage.setItem('sesion', 'activa');
    localStorage.setItem('usuario', JSON.stringify(user));

    const alert = await this.alertController.create({
      header: 'Bienvenido',
      message: 'Inicio de sesión correcto',
      buttons: ['OK']
    });

    await alert.present();

    this.router.navigate(['/tabs/tab2']);
  }
}