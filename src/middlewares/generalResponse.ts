export class GeneralResponse {
  success: boolean;
  error?: string;
  data?: any;

  constructor(success: boolean, error?: string, data?: any) {
    this.success = success;
    this.error = error;
    this.data = data;
  }
}
