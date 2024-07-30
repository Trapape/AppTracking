import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';

const {width, height} = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  buttons,
  imageSource,
  onRequestClose,
}) => {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onRequestClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {imageSource && (
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
            />
          )}
          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  {backgroundColor: button.color || '#2196F3'},
                ]}
                onPress={button.onPress}>
                <Text style={styles.buttonText}>{button.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width * 0.8, // 80% del ancho de la pantalla
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  image: {
    width: width * 0.5, // 25% del ancho de la pantalla
    height: width * 0.25, // Mantener la relación de aspecto cuadrada
    marginBottom: 20,
  },
  title: {
    fontSize: width * 0.05, // 5% del ancho de la pantalla
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: width * 0.04, // 4% del ancho de la pantalla
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: height * 0.015, // 1.5% de la altura de la pantalla
    margin: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.04, // 4% del ancho de la pantalla
  },
});

export default CustomAlert;
