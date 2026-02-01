import Reactotron from 'reactotron-react-native';
import {QueryClientManager, reactotronReactQuery} from 'reactotron-react-query';
import {queryClient} from '../../app/AppProviders';

const queryClientManager = new QueryClientManager({
  queryClient,
});

const reactotron = Reactotron.configure({
  name: 'Crescent Parent App',
  host: 'localhost', // Use localhost with ADB reverse tcp:9090 tcp:9090
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
