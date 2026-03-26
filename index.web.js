import { AppRegistry } from 'react-native';
import App from './App';

console.log('📱 index.web.js - registering App');

AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root'),
});
