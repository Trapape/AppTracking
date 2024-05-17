import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import database from '@react-native-firebase/database';
import SvgSecurity from '../assets/images/SvgSecurity';

function SecurityCodeScreen() {
  const [code, setCode] = useState('');
  const idLoad = '048d7989-fc62-47f1-bfef-1b2f3982800c';

  const handleVerifyCode = async () => {
    try {
      const reference = database().ref(
        `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/securityCodes/${idLoad}`,
      );
      const snapshot = await reference.once('value');
      const firebaseCode = snapshot.val().code;
      if (code === firebaseCode) {
        Alert.alert('Verificación', 'El código ingresado es correcto.');
      } else {
        Alert.alert('Verificación', 'El código ingresado es incorrecto.');
      }
    } catch (error) {
      console.error('Error fetching code from Firebase:', error);
      Alert.alert('Error', 'Hubo un problema al verificar el código.');
    }
  };

  const handleChangeText = (text: string) => {
    const alphanumericText = text.replace(/[^a-zA-Z0-9]/g, ''); // Filtra caracteres no alfanuméricos
    setCode(alphanumericText);
  };

  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <SvgSecurity width="100%" height="100%" />
      </View>
      <Text style={styles.text}>Ingresa el código que te proporcionaron</Text>
      <TextInput
        style={styles.input}
        onChangeText={handleChangeText}
        value={code}
        placeholder="Código de seguridad"
        keyboardType="default" // Cambia esto si el código no es numérico
      />
      <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
        <Text style={styles.buttonText}>Verificar código</Text>
      </TouchableOpacity>
      <Text style={styles.text}>
        El uso de esta información es confidencial, evitar compartir la liga
        tanto el código con cualquier persona ajena a la operación
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  svgContainer: {
    width: 150, // Ajusta el tamaño según sea necesario
    height: 150, // Ajusta el tamaño según sea necesario
    marginBottom: 20,
  },
  image: {
    width: 150, // Ajusta el tamaño según sea necesario
    height: 150, // Ajusta el tamaño según sea necesario
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    borderColor: 'gray',
    borderRadius: 5,
    width: '80%',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default SecurityCodeScreen;
