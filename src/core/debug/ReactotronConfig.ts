import Reactotron from 'reactotron-react-native';
import {QueryClientManager, reactotronReactQuery} from 'reactotron-react-query';
import {queryClient} from '../../app/AppProviders';

const queryClientManager = new QueryClientManager({
  queryClient,
});

const reactotron = Reactotron.configure({
  name: 'Crescent Parent App',
  host: '192.168.1.8', // Your computer's IP for physical device
  onDisconnect: () => {
    queryClientManager.unsubscribe();
  },
})
  .useReactNative({
    asyncStorage: true,
    networking: {
      ignoreUrls: /symbolicate|logs/,
    },
    editor: true,
    errors: {veto: () => false},
    overlay: true,
  })
  .use(reactotronReactQuery(queryClientManager))
  .connect();

// Extend console with Reactotron logging
declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

console.tron = reactotron;

export default reactotron;
