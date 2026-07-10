import { Injectable } from '@angular/core';

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';

import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

const app = initializeApp(environment.firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

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

    const snap =
      await getDocs(collection(db, 'productos'));

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

    const snap =
      await getDoc(doc(db, 'productos', id));

    if (!snap.exists()) return null;

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

  async agregarProveedor(data: any) {

    return await addDoc(
      collection(db, 'proveedores'),
      data
    );

  }

  async obtenerProveedores() {

    const snap =
      await getDocs(collection(db, 'proveedores'));

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

  async login(usuario: string, password: string) {

    const snap =
      await getDocs(collection(db, 'usuarios'));

    const users = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    return users.find((u: any) =>

      u.usuario === usuario &&
      u.password === password

    );

  }

}