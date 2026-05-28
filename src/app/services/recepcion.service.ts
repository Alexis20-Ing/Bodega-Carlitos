import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class RecepcionService {

  constructor(private firestore: Firestore) {}

  // ================================
  // PRODUCTOS
  // ================================

  async agregarProducto(producto: any) {
    const ref = collection(this.firestore, 'productos');
    return await addDoc(ref, producto);
  }

  async obtenerProductos() {
    const ref = collection(this.firestore, 'productos');
    const snapshot = await getDocs(ref);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async actualizarProducto(id: string, data: any) {
    const ref = doc(this.firestore, 'productos', id);
    return await updateDoc(ref, data);
  }

  async eliminarProducto(id: string) {
    const ref = doc(this.firestore, 'productos', id);
    return await deleteDoc(ref);
  }
}