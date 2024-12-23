import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { userAuthAPI } from './services/userAuthAPI'

export const store = configureStore({
  reducer: {
     [userAuthAPI.reducerPath]: userAuthAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userAuthAPI.middleware),
})
setupListeners(store.dispatch)