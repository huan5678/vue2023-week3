import {createApp, ref, onMounted, Ref } from 'vue';
import axios from 'axios';
import Cookies from 'js-cookie';

const baseUrl = 'https://ec-course-api.hexschool.io/v2';

type Product = {
  id?: string;
  title: string;
  category: string;
  content: string;
  description: string;
  imageUrl: string;
  imagesUrl: string[];
  is_enabled: string | number | boolean;
  origin_price: number;
  price: number;
  unit: string;
  imageTemp?: string;
};

type FormStatus = 'new' | 'edit';

createApp({
  setup() {
    const userData = ref({
      username: '',
      password: '',
    });
    const productData = ref({
      success: false,
      products: [],
    });
    const showMessage = ref(false);
    const message = ref('');
    const isLoading = ref(false);
    const isLoggedIn = ref(false);
    const token = ref('');

    const cookieToken = Cookies.get('token');
    const formStatus: Ref<FormStatus> = ref('new')
    const openProductForm = ref(false);

    const config = {
      headers: {
        Authorization: `${token.value || cookieToken || ''}`,
      },
    };
    const temp: Ref<Product> = ref({
      title: '',
      category: '',
      content: '',
      description: '',
      imageUrl: '',
      imagesUrl: [],
      is_enabled: 0,
      origin_price: 0,
      price: 0,
      unit: '',
    });


    async function handleLogin()
    {
      try {
        isLoading.value = true;
        if (userData.value.username === '' || userData.value.password === '') {
          message.value = '請輸入帳號和密碼';
          handleShowMessage(true);
          return isLoading.value = false;
        }
        const res = await axios.post(
          `${baseUrl}/admin/signin`,
          {...userData.value}
        );
        res.data.token && (token.value = res.data.token);
        Cookies.set('token', res.data.token);
        isLoggedIn.value = true;
        isLoading.value = false;
        message.value = '登入成功';
        handleShowMessage(true);
        userData.value = {
          username: '',
          password: '',
        };
        adminGetAllProducts();
      } catch (error) {
        console.log(error);
        isLoading.value = false;
        message.value = '登入失敗，請檢查帳號密碼是否正確!';
        handleShowMessage(true);
      }
    }

    function handleShowMessage(bool: boolean)
    {
      showMessage.value = bool;
    };

      async function handleCheck()
      {
        try {
          const res = await axios.post(`${baseUrl}/api/user/check`, {}, config);
          if (res.data.success) {
            isLoggedIn.value = true;
            message.value = '登入成功';
            handleShowMessage(true);
            return true;
          }
        } catch (error: unknown) {
          if ((error as any)?.response?.data?.success === false) {
            message.value = (error as any).response?.data?.message;
            handleShowMessage(true);
            isLoggedIn.value = false;
          }
        }
    }

    async function adminGetAllProducts()
    {
      try {
        isLoading.value = true;
        const res = await axios.get(`${baseUrl}/api/synthwave/admin/products/all`, config);
        productData.value = res.data;
      } catch (error) {
        if ((error as any)?.response?.data?.success === false) {
          message.value = `取得商品失敗 ${(error as any).response?.data?.message}`;
          handleShowMessage(true);
        }
      }
    }

    async function handleAddProduct()
    {
      try {
        const res = await axios.post(`${baseUrl}/api/synthwave/admin/product`, {
          data: {
            ...temp.value,
            is_enabled: 0,
          }
        }, config);
        console.log(res);
        message.value = res.data.message;
        handleShowMessage(true);
        handleReset();
        adminGetAllProducts();
      } catch (error: unknown) {
        if ((error as any)?.response?.data?.success === false) {
          message.value = `新增商品失敗 ${(error as any).response?.data?.message}`;
          handleShowMessage(true);
        }
      }
    }

    function handleEditProduct(product: Product)
    {
      openProductForm.value = true;
      formStatus.value = 'edit';
      temp.value = {
        ...product,
        origin_price: parseInt(product.origin_price.toString(), 10),
        price: parseInt(product.price.toString(), 10),
      };
    }

      async function handleUpdateProduct() {
        try {
          const res = await axios.put(
            `${baseUrl}/api/synthwave/admin/product/${temp.value.id}`,
            {
              data: {
                ...temp.value,
                is_enabled: temp.value.is_enabled === '1' ? 1 : 0,}
            },
            config
          );
          console.log(res);
          message.value = res.data.message;
          handleShowMessage(true);
          adminGetAllProducts();
        } catch (error: unknown) {
          if ((error as any)?.response?.data?.success === false) {
            message.value = `更新商品失敗 ${(error as any).response?.data?.message}`;
            handleShowMessage(true);
          }
        }
      }

      async function handleDeleteProduct(id: string) {
        try {
          const res = await axios.delete(`${baseUrl}/api/synthwave/admin/product/${id}`, config);
          console.log(res);
          message.value = res.data.message;
          handleShowMessage(true);
          handleReset();
          adminGetAllProducts();
        } catch (error: unknown) {
          if ((error as any)?.response?.data?.success === false) {
            message.value = `刪除商品失敗 ${(error as any).response?.data?.message}`;
            handleShowMessage(true);
          }
        }
      }
    
    function handleAddProductImage(img: string) {
      temp.value.imagesUrl = [ ...temp.value.imagesUrl, img ];
      temp.value.imageTemp = '';
    }

    function handleReset() {
      temp.value = {
        title: '',
        category: '',
        content: '',
        description: '',
        imageUrl: '',
        imagesUrl: [],
        is_enabled: 0,
        origin_price: 0,
        price: 0,
        unit: '',
      };
    }


    onMounted(async () => {
      const isLoading = await handleCheck();
      if (isLoading) {
        adminGetAllProducts();
      }
    });

    return {
      userData,
      productData,
      openProductForm,
      message,
      showMessage,
      isLoading,
      isLoggedIn,
      temp,
      token,
      formStatus,
      handleLogin,
      handleCheck,
      handleShowMessage,
      handleAddProductImage,
      adminGetAllProducts,
      handleAddProduct,
      handleEditProduct,
      handleUpdateProduct,
      handleDeleteProduct,
      handleReset,
    };
  },
}).mount('#app');