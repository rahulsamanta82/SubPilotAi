export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateSubscription(data: any): string | null {
  if (!data.name || typeof data.name !== 'string') {
    return 'Subscription name is required and must be a string.';
  }
  if (typeof data.price !== 'number' || data.price < 0) {
    return 'Subscription price is required and must be a positive number.';
  }
  return null;
}
