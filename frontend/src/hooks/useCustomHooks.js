import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing API calls with loading, error, and success states
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Configuration options
 */
export const useApiCall = (apiCall, options = {}) => {
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'An error occurred',
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        const result = await apiCall(...args, { signal: abortControllerRef.current.signal });
        
        if (showSuccessToast) {
          toast.success(successMessage);
        }
        
        onSuccess?.(result);
        return result;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        const message = err.response?.data?.detail || err.message || errorMessage;
        setError(message);

        if (showErrorToast) {
          toast.error(message);
        }

        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, onSuccess, onError, showSuccessToast, showErrorToast, successMessage, errorMessage]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { execute, loading, error, cancel };
};

/**
 * Custom hook for managing list data with pagination and filtering
 */
export const useListData = (fetchFn, options = {}) => {
  const { pageSize = 20, autoFetch = true } = options;
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({});

  const fetchData = useCallback(
    async (pageNum = 1, filtersObj = {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn({
          page: pageNum,
          page_size: pageSize,
          ...filtersObj,
        });

        if (Array.isArray(result)) {
          setData(result);
          setHasMore(false);
        } else {
          setData(result.items || result.results || []);
          setHasMore(!!result.next);
        }

        setPage(pageNum);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, pageSize]
  );

  const updateFilters = useCallback(
    (newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPage(1);
      fetchData(1, { ...filters, ...newFilters });
    },
    [filters, fetchData]
  );

  const refresh = useCallback(() => {
    fetchData(page, filters);
  }, [fetchData, page, filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchData(1, filters);
    }
  }, []);

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    filters,
    fetchData,
    updateFilters,
    refresh,
    setPage,
  };
};

/**
 * Custom hook for managing form state with validation
 */
export const useFormState = (initialValues = {}, onSubmit, options = {}) => {
  const { validate, validationRules = {} } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validateForm = useCallback(async () => {
    if (validate) {
      try {
        await validate(values);
        setErrors({});
        return true;
      } catch (err) {
        setErrors(err.fieldErrors || { submit: err.message });
        return false;
      }
    }
    return true;
  }, [values, validate]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      
      const isValid = await validateForm();
      if (!isValid) return;

      setLoading(true);
      try {
        await onSubmit(values);
      } catch (err) {
        setErrors({ submit: err.message });
      } finally {
        setLoading(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    loading,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    setValues,
  };
};

/**
 * Custom hook for managing modal state
 */
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);

  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setData(null), 300); // Clear after animation
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
  };
};

/**
 * Custom hook for managing confirmation dialogs
 */
export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Confirm');
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (confirmTitle = 'Confirm', confirmMessage = 'Are you sure?') => {
      return new Promise((resolve) => {
        setTitle(confirmTitle);
        setMessage(confirmMessage);
        setIsOpen(true);
        resolveRef.current = resolve;
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    message,
    title,
    confirm,
    handleConfirm,
    handleCancel,
  };
};
