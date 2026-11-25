
import { Injectable, NgZone } from '@angular/core';

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';

import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================

const app = initializeApp(environment.firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private ngZone: NgZone) {}

  // ==========================================
  // AUTENTICACIÓN CON FIREBASE
  // ==========================================

  // REGISTRAR USUARIO CON CORREO Y CONTRASEÑA
  async registrarUsuario(
    nombre: string,
    email: string,
    password: string
  ) {
    const credencial = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    await updateProfile(credencial.user, {
      displayName: nombre.trim()
    });

    return {
      id: credencial.user.uid,
      nombre: nombre.trim(),
      usuario: credencial.user.email ?? email,
      email: credencial.user.email ?? email,
      rol: 'cliente'
    };
  }

  // INICIAR SESIÓN CON CORREO Y CONTRASEÑA
  async loginConCorreo(email: string, password: string) {
    const credencial = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return {
      id: credencial.user.uid,
      nombre:
        credencial.user.displayName ||
        credencial.user.email?.split('@')[0] ||
        'Usuario',
      usuario: credencial.user.email ?? email,
      email: credencial.user.email ?? email,
      rol: 'cliente'
    };
  }

  // INICIAR SESIÓN CON GOOGLE
  async loginConGoogle() {
    const proveedor = new GoogleAuthProvider();
    proveedor.setCustomParameters({
      prompt: 'select_account'
    });

    const resultado = await signInWithPopup(auth, proveedor);
    const usuario = resultado.user;

    return {
      id: usuario.uid,
      nombre:
        usuario.displayName ||
        usuario.email?.split('@')[0] ||
        'Usuario',
      usuario: usuario.email ?? '',
      email: usuario.email ?? '',
      rol: 'cliente'
    };
  }

  // ==========================================
  // PRODUCTOS DEL APLICATIVO ANTERIOR
  // COLECCIÓN: productos
  // ==========================================

  async agregarProducto(data: any) {
    return await addDoc(
      collection(db, 'productos'),
      {
        ...data,
        estado: data.estado ?? 'pendiente'
      }
    );
  }

  async obtenerProductos() {
    const snap = await getDocs(
      collection(db, 'productos')
    );

    return snap.docs.map(d => {
      const data: any = d.data();

      return {
        id: d.id,
        ...data,
        estado: data.estado ?? 'pendiente'
      };
    });
  }

  async obtenerProductoPorId(id: string) {
    const snap = await getDoc(
      doc(db, 'productos', String(id))
    );

    if (!snap.exists()) {
      return null;
    }

    return {
      id: snap.id,
      ...snap.data()
    };
  }

  async actualizarProducto(id: string, data: any) {
    return await updateDoc(
      doc(db, 'productos', String(id)),
      data
    );
  }

  async eliminarProducto(id: string) {
    return await deleteDoc(
      doc(db, 'productos', String(id))
    );
  }

  // ==========================================
  // CATÁLOGO DE PRODUCTOS
  // COLECCIÓN: catalogo_productos
  // ==========================================

  async agregarProductoCatalogo(data: any) {
    return await addDoc(
      collection(db, 'catalogo_productos'),
      {
        ...data,
        estado: data.estado ??
          (
            Number(data.cantidad) > 0
              ? 'disponible'
              : 'agotado'
          )
      }
    );
  }

  async obtenerProductosCatalogo() {
    const snap = await getDocs(
      collection(db, 'catalogo_productos')
    );

    return snap.docs.map(d => {
      const data: any = d.data();

      return {
        id: d.id,
        ...data,
        estado: data.estado ??
          (
            Number(data.cantidad ?? 0) > 0
              ? 'disponible'
              : 'agotado'
          )
      };
    });
  }

  async obtenerProductoCatalogoPorId(id: string) {
    const snap = await getDoc(
      doc(db, 'catalogo_productos', String(id))
    );

    if (!snap.exists()) {
      return null;
    }

    return {
      id: snap.id,
      ...snap.data()
    };
  }

  async actualizarProductoCatalogo(id: string, data: any) {
    return await updateDoc(
      doc(db, 'catalogo_productos', String(id)),
      data
    );
  }

  async eliminarProductoCatalogo(id: string) {
    return await deleteDoc(
      doc(db, 'catalogo_productos', String(id))
    );
  }

  // ==========================================
  // PROVEEDORES
  // COLECCIÓN: proveedores
  // ==========================================

  async agregarProveedor(data: any) {
    return await addDoc(
      collection(db, 'proveedores'),
      data
    );
  }

  async obtenerProveedores() {
    const snap = await getDocs(
      collection(db, 'proveedores')
    );

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  async actualizarProveedor(id: string, data: any) {
    return await updateDoc(
      doc(db, 'proveedores', String(id)),
      data
    );
  }

  async eliminarProveedor(id: string) {
    return await deleteDoc(
      doc(db, 'proveedores', String(id))
    );
  }

  // ==========================================
  // LOGIN ANTIGUO
  // COLECCIÓN: usuarios
  // CONSERVADO PARA EL ADMINISTRADOR EXISTENTE
  // ==========================================

  async login(usuario: string, password: string) {
    const snap = await getDocs(
      collection(db, 'usuarios')
    );

    const users = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    return users.find(
      (u: any) =>
        u.usuario === usuario &&
        u.password === password
    );
  }

  // ==========================================
  // PEDIDOS
  // COLECCIÓN: pedidos
  // ==========================================

  async agregarPedido(data: any) {
    return await addDoc(
      collection(db, 'pedidos'),
      data
    );
  }

  async obtenerPedidos() {
    const snap = await getDocs(
      collection(db, 'pedidos')
    );

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  // ==========================================
  // ACTUALIZAR ESTADO DE UN PEDIDO
  // ==========================================

  async actualizarEstadoPedido(
    id: string,
    estado: string
  ) {
    if (!id || !estado) {
      throw new Error(
        'Se necesita el ID del pedido y el nuevo estado.'
      );
    }

    await updateDoc(
      doc(db, 'pedidos', String(id)),
      { estado }
    );
  }

  // ==========================================
  // ESCUCHAR PEDIDOS EN TIEMPO REAL
  // ==========================================

  escucharPedidos(
    alActualizar: (pedidos: any[]) => void,
    alError?: (error: any) => void
  ): () => void {

    const cancelarEscucha = onSnapshot(
      collection(db, 'pedidos'),

      snapshot => {
        const pedidos = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));

        this.ngZone.run(() => {
          alActualizar(pedidos);
        });
      },

      error => {
        console.error('Error al escuchar pedidos:', error);

        this.ngZone.run(() => {
          if (alError) {
            alError(error);
          }
        });
      }
    );

    return cancelarEscucha;
  }

  // ==========================================
  // PEDIDO ANTIGUO
  // DESCUENTA STOCK DE: productos
  // ==========================================

  async realizarPedidoConStock(pedido: any) {
    return await runTransaction(
      db,
      async transaction => {

        const productosVerificados: any[] = [];

        for (const producto of pedido.productos) {
          const productoRef = doc(
            db,
            'productos',
            String(producto.id)
          );

          const productoSnap =
            await transaction.get(productoRef);

          if (!productoSnap.exists()) {
            throw new Error(
              `El producto "${producto.producto}" ya no existe.`
            );
          }

          const datos: any = productoSnap.data();

          const stockActual = Number(
            datos.cantidad ?? 0
          );

          const cantidadSolicitada = Number(
            producto.cantidad ?? 0
          );

          if (
            !Number.isInteger(cantidadSolicitada) ||
            cantidadSolicitada < 1 ||
            stockActual < cantidadSolicitada
          ) {
            throw new Error(
              `STOCK_INSUFICIENTE:${producto.producto}:${stockActual}`
            );
          }

          productosVerificados.push({
            ref: productoRef,
            stockActual,
            cantidadSolicitada
          });
        }

        for (const producto of productosVerificados) {
          transaction.update(
            producto.ref,
            {
              cantidad:
                producto.stockActual -
                producto.cantidadSolicitada
            }
          );
        }

        const pedidoRef = doc(
          collection(db, 'pedidos')
        );

        transaction.set(pedidoRef, pedido);

        return pedidoRef;
      }
    );
  }

  // ==========================================
  // PEDIDO DEL CATÁLOGO NUEVO
  // DESCUENTA STOCK DE: catalogo_productos
  // ==========================================

  async realizarPedidoConStockCatalogo(pedido: any) {
    return await runTransaction(
      db,
      async transaction => {

        const productosVerificados: any[] = [];

        for (const producto of pedido.productos) {
          const productoRef = doc(
            db,
            'catalogo_productos',
            String(producto.id)
          );

          const productoSnap =
            await transaction.get(productoRef);

          if (!productoSnap.exists()) {
            throw new Error(
              `STOCK_INSUFICIENTE:${producto.producto}:0`
            );
          }

          const datos: any = productoSnap.data();

          const stockActual = Number(
            datos.cantidad ?? 0
          );

          const cantidadSolicitada = Number(
            producto.cantidad ?? 0
          );

          if (
            !Number.isInteger(cantidadSolicitada) ||
            cantidadSolicitada < 1 ||
            stockActual < cantidadSolicitada
          ) {
            throw new Error(
              `STOCK_INSUFICIENTE:${producto.producto}:${stockActual}`
            );
          }

          productosVerificados.push({
            ref: productoRef,
            stockActual,
            cantidadSolicitada
          });
        }

        for (const producto of productosVerificados) {
          const nuevoStock =
            producto.stockActual -
            producto.cantidadSolicitada;

          transaction.update(
            producto.ref,
            {
              cantidad: nuevoStock,
              estado: nuevoStock > 0
                ? 'disponible'
                : 'agotado'
            }
          );
        }

        const pedidoRef = doc(
          collection(db, 'pedidos')
        );

        transaction.set(pedidoRef, pedido);

        return pedidoRef;
      }
    );
  }

  // ==========================================
  // ESCUCHAR CATÁLOGO EN TIEMPO REAL
  // ==========================================

  escucharProductosCatalogo(
    alActualizar: (productos: any[]) => void,
    alError?: (error: any) => void
  ): () => void {

    const referencia = collection(
      db,
      'catalogo_productos'
    );

    const cancelar = onSnapshot(
      referencia,

      snapshot => {
        const productos = snapshot.docs.map(documento => {
          const datos: any = documento.data();

          return {
            id: documento.id,
            ...datos,
            estado: datos.estado ??
              (
                Number(datos.cantidad ?? 0) > 0
                  ? 'disponible'
                  : 'agotado'
              )
          };
        });

        this.ngZone.run(() => {
          alActualizar(productos);
        });
      },

      error => {
        console.error(
          'Error al escuchar el catálogo:',
          error
        );

        this.ngZone.run(() => {
          if (alError) {
            alError(error);
          }
        });
      }
    );

    return cancelar;
  }
}
