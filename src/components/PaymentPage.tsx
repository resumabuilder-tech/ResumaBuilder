import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Crown, CheckCircle, Upload, Copy, Building, Sparkles, CreditCard } from 'lucide-react';
import logo from 'figma:asset/2cc5c58a6356b9bc99595ba4c64a3c807447e92a.png';

interface PaymentPageProps {
  onBack: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [txReference, setTxReference] = useState('');
  const [amount, setAmount] = useState('2999');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bankDetails = {
    bankName: 'HBL Bank',
    accountTitle: 'Resumize Pakistan',
    accountNumber: '12345678901234',
    iban: 'PK36HABB0012345678901234'
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
    }
  };

  const submitPaymentProof = async () => {
    if (!txReference.trim()) {
      alert('Please enter the transaction reference number');
      return;
    }

    if (!proofImage) {
      alert('Please upload payment proof image');
      return;
    }

    setIsSubmitting(true);
    
    // Mock payment submission - replace with actual Supabase call
    setTimeout(() => {
      alert('Payment proof submitted successfully! Your account will be upgraded within 24 hours after verification.');
      setIsSubmitting(false);
      onBack();
    }, 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-green-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-pink-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Resumize" className="h-6 w-6" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-green-600 bg-clip-text text-transparent">Upgrade to Premium</h1>
            </div>
          </div>
          
          <Badge variant="secondary">Free Plan</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Premium Benefits */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <Crown className="h-10 w-10" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Upgrade to Premium</h2>
              <p className="text-xl md:text-2xl">
                Unlock all AI-powered features for just <span className="font-bold text-3xl">PKR 2,999</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">✨ Premium Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Unlimited AI resume generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>AI-powered cover letter generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Editable resumes and cover letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Multiple resume templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Priority customer support</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">🎯 Free vs Premium</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Resume Downloads</span>
                    <span>Free: View Only | Premium: Unlimited</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cover Letters</span>
                    <span>Free: ❌ | Premium: ✅</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Editing</span>
                    <span>Free: ❌ | Premium: ✅</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Regeneration</span>
                    <span>Free: ❌ | Premium: ✅</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support</span>
                    <span>Free: Basic | Premium: Priority</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Instructions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Bank Transfer Details
                </CardTitle>
                <CardDescription>
                  Transfer PKR 2,999 to the following account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Bank Name:</span>
                    <div className="flex items-center gap-2">
                      <span>{bankDetails.bankName}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(bankDetails.bankName)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Account Title:</span>
                    <div className="flex items-center gap-2">
                      <span>{bankDetails.accountTitle}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(bankDetails.accountTitle)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{bankDetails.accountNumber}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(bankDetails.accountNumber)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">IBAN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{bankDetails.iban}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(bankDetails.iban)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="font-medium text-lg">Amount:</span>
                    <span className="font-bold text-lg text-green-600">PKR 2,999</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Transfer exactly PKR 2,999 to the above account</li>
                    <li>Keep the transaction receipt/screenshot</li>
                    <li>Note down the transaction reference number</li>
                    <li>Upload the payment proof using the form</li>
                    <li>Your account will be upgraded within 24 hours</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>If you face any issues with payment, contact our support:</p>
                <div className="space-y-2">
                  <div><strong>WhatsApp:</strong> +92-300-1234567</div>
                  <div><strong>Email:</strong> support@resumize.com</div>
                  <div><strong>Hours:</strong> 9 AM - 6 PM (Mon-Fri)</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Submit Payment Proof
                </CardTitle>
                <CardDescription>
                  Upload your payment receipt to complete the upgrade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="tx-reference">Transaction Reference Number</Label>
                  <Input
                    id="tx-reference"
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value)}
                    placeholder="Enter transaction ID/reference"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount Transferred</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2999"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="proof-image">Payment Proof (Screenshot/Receipt)</Label>
                  <div className="mt-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {proofImage ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                          <p className="text-sm font-medium text-green-600">
                            {proofImage.name}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProofImage(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Upload your payment receipt or screenshot
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="proof-upload"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById('proof-upload')?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Please ensure your payment proof clearly shows:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                    <li>Transaction amount (PKR 2,999)</li>
                    <li>Date and time of transfer</li>
                    <li>Transaction reference number</li>
                    <li>Receiving account details</li>
                  </ul>
                </div>

                <Button 
                  className="w-full" 
                  onClick={submitPaymentProof}
                  disabled={isSubmitting || !txReference.trim() || !proofImage}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Payment Proof'}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  Your account will be upgraded within 24 hours after verification
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
