import React from 'react';
import {View, Modal, StyleSheet, Dimensions} from 'react-native';
import LottieView from 'lottie-react-native';

const {width, height} = Dimensions.get('window');

const Loader = ({loading}) => {
  return (
    <Modal
      transparent={true}
      animationType={'none'}
      visible={loading}
      onRequestClose={() => {
        console.log('close modal');
      }}>
      <View style={styles.modalBackground}>
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../assets/animations/loading.json')} // Asegúrate que esta ruta es correcta
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  animationContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.8)', // Gris con transparencia
    width: width * 0.9, // 40% del ancho de la pantalla
    height: height * 0.9, // 20% de la altura de la pantalla
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '100%', // 80% del contenedor
    height: '100%', // 80% del contenedor
  },
});

export default Loader;
