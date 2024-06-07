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
import {useAppContext} from '../context/AppContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import Loader from '../componeentes/Loader';
import CustomAlert from '../componeentes/CustomAlert';

function SecurityCodeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [code, setCode] = useState('');
  const {id} = useAppContext();

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const reference = database().ref(
        `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/securityCodes/${id}`,
      );
      const snapshot = await reference.once('value');
      const firebaseCode = snapshot.val().code;
      if (code === firebaseCode) {
        setLoading(false);
        setAlertVisible(true);
        //navigation.navigate('Tracking');
      } else {
        setLoading(false);
        Alert.alert('Verificación', 'El código ingresado es incorrecto.');
      }
    } catch (err) {
      setLoading(false);
      console.error('Error fetching code from Firebase:', err);
      Alert.alert('Error', (err as Error).message || JSON.stringify(err));
    }
  };

  const handleChangeText = (text: string) => {
    const alphanumericText = text.replace(/[^a-zA-Z0-9]/g, ''); // Filtra caracteres no alfanuméricos
    setCode(alphanumericText);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    Alert.alert(
      'Información',
      'Cuando esté listo para comenzar el viaje, vuelva a hacer clic en el enlace e ingrese el código de seguridad nuevamente.',
    );
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
    navigation.navigate('Tracking');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Location Permission Screen</Text>
      <Text>Código de verificación: {id}</Text>
      <View style={styles.svgContainer}>
        <SvgSecurity width="100%" height="100%" />
      </View>
      <Text style={styles.text}>Ingresa el código que te proporcionaron</Text>
      <TextInput
        style={styles.input}
        onChangeText={handleChangeText}
        value={code}
        placeholder="Código de seguridad"
        keyboardType="default"
        textAlign="center"
        placeholderTextColor="gray"
      />
      <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
        <Text style={styles.buttonText}>Verificar código</Text>
      </TouchableOpacity>
      <Text style={styles.text}>
        El uso de esta información es confidencial, evitar compartir la liga
        tanto el código con cualquier persona ajena a la operación
      </Text>
      <Loader loading={loading} />
      <CustomAlert
        visible={alertVisible}
        title="Confirmación"
        message="¿Está listo para comenzar la operación?"
        imageSource={require('../assets/images/undraw_navigator_green.png')}
        buttons={[
          {text: 'No', onPress: handleAlertClose, color: '#FF6347'},
          {text: 'Sí', onPress: handleAlertConfirm, color: '#32CD32'},
        ]}
        onRequestClose={() => setAlertVisible(false)}
      />
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
    fontSize: 18,
    textAlign: 'center',
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
