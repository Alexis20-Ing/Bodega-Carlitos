
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

  nombre = '';
  usuario = '';
  password = '';
  modoRegistro = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private firebaseService: FirebaseService
  ) {}

  cambiarModo() {
    this.modoRegistro = !this.modoRegistro;
    this.nombre = '';
    this.usuario = '';
    this.password = '';
  }

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  async ingresar() {
    const usuario = this.usuario.trim();

    if (!usuario || !this.password) {
      await this.mostrarAviso(
        'Campos incompletos',
        'Completa el usuario o correo y la contraseña.'
      );
      return;
    }

    try {
      let user: any;

      if (usuario.includes('@')) {
        user = await this.firebaseService.loginConCorreo(
          usuario,
          this.password
        );
      } else {
        // Acceso anterior mediante usuario y contraseña.
        user = await this.firebaseService.login(
          usuario,
          this.password
        );

        if (!user) {
          await this.mostrarAviso(
            'Acceso denegado',
            'Usuario o contraseña incorrectos.'
          );
          return;
        }

        user = {
          ...user,
          nombre: user.nombre || user.usuario || usuario,
          rol: user.rol || 'cliente'
        };
      }

      this.guardarSesion(user);

      await this.mostrarAviso(
        'Bienvenido',
        `¡Hola, ${user.nombre}! Has iniciado sesión correctamente.`
      );

      this.redirigirSegunRol(user.rol);

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      let mensaje =
        'No se pudo iniciar sesión. Inténtalo nuevamente.';

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        mensaje = 'El correo o la contraseña son incorrectos.';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'El correo electrónico no es válido.';
      } else if (error.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos. Inténtalo más tarde.';
      } else if (error.code === 'auth/operation-not-allowed') {
        mensaje =
          'Activa Correo electrónico/contraseña en Firebase Authentication.';
      }

      await this.mostrarAviso('Error', mensaje);
    }
  }

  // ==========================================
  // REGISTRAR CUENTA
  // ==========================================

  async registrar() {
    const nombre = this.nombre.trim();
    const email = this.usuario.trim();
    const password = this.password;

    if (!nombre || !email || !password) {
      await this.mostrarAviso(
        'Campos incompletos',
        'Ingresa tu nombre, correo electrónico y contraseña.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await this.mostrarAviso(
        'Correo inválido',
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    if (password.length < 6) {
      await this.mostrarAviso(
        'Contraseña muy corta',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    try {
      const user = await this.firebaseService.registrarUsuario(
        nombre,
        email,
        password
      );

      this.guardarSesion(user);

      await this.mostrarAviso(
        'Cuenta creada',
        `¡Bienvenido a Bodega Express, ${user.nombre}!`
      );

      this.router.navigate(['/tabs/tab2']);

    } catch (error: any) {
      console.error('Error al registrar usuario:', error);

      let mensaje =
        'No se pudo crear la cuenta. Inténtalo nuevamente.';

      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'Este correo ya tiene una cuenta registrada.';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'El correo electrónico no es válido.';
      } else if (error.code === 'auth/weak-password') {
        mensaje = 'La contraseña es demasiado débil.';
      } else if (error.code === 'auth/operation-not-allowed') {
        mensaje =
          'Activa Correo electrónico/contraseña en Firebase Authentication.';
      }

      await this.mostrarAviso('Error de registro', mensaje);
    }
  }

  // ==========================================
  // INICIAR SESIÓN CON GOOGLE
  // ==========================================

  async ingresarConGoogle() {
    try {
      const user = await this.firebaseService.loginConGoogle();

      this.guardarSesion(user);

      await this.mostrarAviso(
        'Bienvenido',
        `¡Hola, ${user.nombre}! Has ingresado con Google.`
      );

      this.router.navigate(['/tabs/tab2']);

    } catch (error: any) {
      console.error('Error al ingresar con Google:', error);

      let mensaje =
        'No se pudo iniciar sesión con Google.';

      if (error.code === 'auth/popup-closed-by-user') {
        mensaje = 'Cerraste la ventana de inicio de sesión.';
      } else if (error.code === 'auth/unauthorized-domain') {
        mensaje =
          'El dominio de la aplicación no está autorizado en Firebase.';
      } else if (error.code === 'auth/popup-blocked') {
        mensaje =
          'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e inténtalo nuevamente.';
      } else if (error.code === 'auth/operation-not-allowed') {
        mensaje =
          'Activa Google en los métodos de acceso de Firebase.';
      }

      await this.mostrarAviso('Error', mensaje);
    }
  }

  // ==========================================
  // GUARDAR SESIÓN
  // ==========================================

  private guardarSesion(user: any) {
    const sesion = {
      id: user.id,
      usuario: user.usuario || user.email || '',
      nombre: user.nombre || user.displayName || 'Usuario',
      rol: user.rol || 'cliente'
    };

    localStorage.setItem('sesion', JSON.stringify(sesion));
    localStorage.setItem('usuario', JSON.stringify(sesion));
  }

  // ==========================================
  // REDIRIGIR SEGÚN ROL
  // ==========================================

  private redirigirSegunRol(rol: string) {
    if (rol === 'admin') {
      this.router.navigate(['/admin-pedidos']);
    } else {
      this.router.navigate(['/tabs/tab2']);
    }
  }

  // ==========================================
  // MOSTRAR MENSAJES
  // ==========================================

  private async mostrarAviso(
    titulo: string,
    mensaje: string
  ) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }
}
